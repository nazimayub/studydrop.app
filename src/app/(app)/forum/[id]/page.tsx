
"use client"
import { useEffect, useState } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment, writeBatch, runTransaction, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ThumbsUp, Paperclip, ThumbsDown, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/app/vote-buttons";
import { CommentsSection } from "@/components/app/comments-section";
import { Input } from "@/components/ui/input";


interface PostTag {
    class: string;
    topic: string;
}
interface Post {
    id: string;
    title: string;
    author: string;
    authorId: string;
    avatar: string;
    fallback: string;
    date: any;
    content: string;
    upvotes: number;
    downvotes: number;
    tags?: PostTag[];
    attachmentURL?: string;
    attachmentName?: string;
}

interface Answer {
    id: string;
    author: string;
    authorId: string;
    avatar: string;
    fallback: string;
    date: any;
    content: string;
    upvotes: number;
    downvotes: number;
    isAccepted?: boolean;
    attachmentURL?: string;
    attachmentName?: string;
}

interface UserVoteState {
    [answerId: string]: 'up' | 'down' | null;
}

export default function ForumPostPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [post, setPost] = useState<Post | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswer, setNewAnswer] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [userVotes, setUserVotes] = useState<UserVoteState>({});
    const [postUserVote, setPostUserVote] = useState<'up' | 'down' | null>(null);


    const fetchPostAndAnswers = () => {
        if (!id) return;
        
        const postUnsubscribe = onSnapshot(doc(db, "questions", id), async (postSnapshot) => {
            if (postSnapshot.exists()) {
                const postData = postSnapshot.data() as Post;
                setPost({ id: postSnapshot.id, ...postData });

                 if (user) {
                    const userVoteDocRef = doc(db, "users", user.uid, "votes", `question-${id}`);
                    const userVoteDoc = await getDoc(userVoteDocRef);
                    if (userVoteDoc.exists()) {
                        setPostUserVote(userVoteDoc.data().type);
                    } else {
                        setPostUserVote(null);
                    }
                }
            }
        });

        const answersCollection = collection(db, "questions", id, "answers");
        const answersQuery = query(answersCollection, orderBy("date", "desc"));
        const answersUnsubscribe = onSnapshot(answersQuery, async (answersSnapshot) => {
            const answersList = answersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer)).sort((a, b) => {
                if (a.isAccepted && !b.isAccepted) return -1;
                if (!a.isAccepted && b.isAccepted) return 1;
                const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
                const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
                if (scoreA !== scoreB) return scoreB - scoreA;
                if (b.date && a.date) {
                   return b.date.seconds - a.date.seconds;
                }
                return 0;
            });
            setAnswers(answersList);

            if (user) {
                const newVotes: UserVoteState = {};
                for (const answer of answersList) {
                    const voteDocRef = doc(db, "users", user.uid, "votes", `answer-${answer.id}`);
                    const voteDoc = await getDoc(voteDocRef);
                    if (voteDoc.exists()) {
                        newVotes[answer.id] = voteDoc.data().type;
                    } else {
                        newVotes[answer.id] = null;
                    }
                }
                setUserVotes(newVotes);
            }
        });

        return () => {
            postUnsubscribe();
            answersUnsubscribe();
        };
    };

    useEffect(() => {
        const incrementViewCount = async () => {
             const postRef = doc(db, "questions", id);
             await updateDoc(postRef, {
                views: increment(1)
            }).catch(err => console.error("Failed to increment view count:", err));
        }
        if (id) {
            incrementViewCount();
            const unsubscribe = fetchPostAndAnswers();
            return unsubscribe;
        }
    }, [id, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handlePostAnswer = async () => {
        if (!newAnswer.trim() || !user || !post) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        let authorName = "Anonymous";
        let authorFallback = "A";
        let authorAvatar = "";

        if (userDoc.exists()) {
            const userData = userDoc.data();
            authorName = `${userData.firstName} ${userData.lastName}`;
            authorFallback = `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`;
            authorAvatar = userData.photoURL || "";
        }

        try {
            const batch = writeBatch(db);

            let attachmentURL = "";
            let attachmentName = "";
            if (attachment) {
                const storageRef = ref(storage, `attachments/answers/${user.uid}/${Date.now()}_${attachment.name}`);
                await uploadBytes(storageRef, attachment);
                attachmentURL = await getDownloadURL(storageRef);
                attachmentName = attachment.name;
            }

            const answerRef = doc(collection(db, "questions", id, "answers"));
            batch.set(answerRef, {
                author: authorName,
                avatar: authorAvatar,
                fallback: authorFallback,
                content: newAnswer,
                date: serverTimestamp(),
                upvotes: 0,
                downvotes: 0,
                authorId: user.uid,
                isAccepted: false,
                attachmentURL,
                attachmentName
            });

            const questionRef = doc(db, "questions", id);
            batch.update(questionRef, { replies: increment(1) });

            const userDocRef = doc(db, "users", user.uid);
            batch.update(userDocRef, { points: increment(15) });

            if (post.authorId && post.authorId !== user.uid) {
                const questionAuthorDoc = await getDoc(doc(db, 'users', post.authorId));
                if (questionAuthorDoc.exists() && questionAuthorDoc.data().notificationPreferences?.answersOnQuestions) {
                    const notificationRef = doc(collection(db, 'users', post.authorId, 'notifications'));
                    batch.set(notificationRef, {
                        type: 'new_answer',
                        message: `${authorName} answered your question: "${post.title}"`,
                        link: `/forum/${id}`,
                        isRead: false,
                        date: serverTimestamp(),
                    });
                }
            }

            await batch.commit();

            setNewAnswer("");
            setAttachment(null);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };
    
   const handlePostVote = async (voteType: 'up' | 'down') => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required" });
            return;
        }
        if (!post || user.uid === post.authorId) {
            toast({ variant: "destructive", description: "You cannot vote on your own question." });
            return;
        }

        const postRef = doc(db, "questions", id);
        const userVoteRef = doc(db, "users", user.uid, "votes", `question-${id}`);
        const authorRef = doc(db, "users", post.authorId);

        try {
            await runTransaction(db, async (transaction) => {
                const userVoteDoc = await transaction.get(userVoteRef);
                const authorDoc = await transaction.get(authorRef);
                if (!authorDoc.exists()) {
                    throw "Author does not exist!";
                }

                const currentVote = userVoteDoc.exists() ? userVoteDoc.data().type : null;
                let postUpdate: any = {};
                let pointsChange = 0;

                if (currentVote === voteType) {
                    transaction.delete(userVoteRef);
                    if (voteType === 'up') {
                        postUpdate.upvotes = increment(-1);
                        pointsChange = -2;
                    } else {
                        postUpdate.downvotes = increment(-1);
                    }
                    setPostUserVote(null);
                } else {
                    transaction.set(userVoteRef, { type: voteType });
                    if (currentVote === 'up') {
                        postUpdate.upvotes = increment(-1);
                        pointsChange = -2;
                    } else if (currentVote === 'down') {
                        postUpdate.downvotes = increment(-1);
                    }

                    if (voteType === 'up') {
                        postUpdate.upvotes = increment(1);
                        pointsChange += 2;
                    } else {
                        postUpdate.downvotes = increment(1);
                    }
                    setPostUserVote(voteType);
                }

                transaction.update(postRef, postUpdate);
                if (pointsChange !== 0) {
                    transaction.update(authorRef, { points: increment(pointsChange) });
                }
            });
        } catch (error) {
            console.error(`Error ${voteType}ing post:`, error);
            toast({ variant: "destructive", title: "Error", description: "Your vote could not be recorded." });
        }
    };

    const handleAnswerVote = async (answer: Answer, voteType: 'up' | 'down') => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required" });
            return;
        }
        if (user.uid === answer.authorId) {
            toast({ variant: "destructive", description: "You cannot vote on your own answer." });
            return;
        }

        const answerRef = doc(db, "questions", id, "answers", answer.id);
        const userVoteRef = doc(db, "users", user.uid, "votes", `answer-${answer.id}`);
        const authorRef = doc(db, "users", answer.authorId);

        try {
            await runTransaction(db, async (transaction) => {
                const userVoteDoc = await transaction.get(userVoteRef);
                const authorDoc = await transaction.get(authorRef);
                if (!authorDoc.exists()) {
                    throw "Author does not exist!";
                }

                const currentVote = userVoteDoc.exists() ? userVoteDoc.data().type : null;
                let answerUpdate: any = {};
                let pointsChange = 0;

                const optimisticVotes = { ...userVotes };

                if (currentVote === voteType) {
                    transaction.delete(userVoteRef);
                    if (voteType === 'up') {
                        answerUpdate.upvotes = increment(-1);
                        pointsChange = -5;
                    } else {
                        answerUpdate.downvotes = increment(-1);
                    }
                    optimisticVotes[answer.id] = null;
                } else {
                    transaction.set(userVoteRef, { type: voteType });
                    if (currentVote === 'up') {
                        answerUpdate.upvotes = increment(-1);
                        pointsChange = -5;
                    } else if (currentVote === 'down') {
                        answerUpdate.downvotes = increment(-1);
                    }

                    if (voteType === 'up') {
                        answerUpdate.upvotes = increment(1);
                        pointsChange += 5;
                    } else {
                        answerUpdate.downvotes = increment(1);
                    }
                    optimisticVotes[answer.id] = voteType;
                }

                setUserVotes(optimisticVotes);
                transaction.update(answerRef, answerUpdate);
                if (pointsChange !== 0 && answer.authorId) {
                    transaction.update(authorRef, { points: increment(pointsChange) });
                }
            });
        } catch (error) {
            console.error(`Error ${voteType}ing answer:`, error);
            toast({ variant: "destructive", title: "Error", description: "Your vote could not be recorded." });
        }
    };


     const handleAcceptAnswer = async (answerToAccept: Answer) => {
        if (!user || user.uid !== post?.authorId) return;

        const batch = writeBatch(db);

        answers.forEach(answer => {
            const answerRef = doc(db, "questions", id, "answers", answer.id);
            if (answer.id === answerToAccept.id) {
                 batch.update(answerRef, { isAccepted: !answer.isAccepted }); // Toggle accept
            } else if (answer.isAccepted) {
                batch.update(answerRef, { isAccepted: false }); // Un-accept other
            }
        });

        const answerAuthorRef = doc(db, "users", answerToAccept.authorId);
        const questionAuthorRef = doc(db, "users", post.authorId);

        // if we are accepting the answer
        if (!answerToAccept.isAccepted) {
             batch.update(answerAuthorRef, { points: increment(25) });
             batch.update(questionAuthorRef, { points: increment(5) }); // Bonus for picking an answer
        } else { // if we are un-accepting
            batch.update(answerAuthorRef, { points: increment(-25) });
            batch.update(questionAuthorRef, { points: increment(-5) });
        }
        
        try {
            await batch.commit();
            toast({
                title: answerToAccept.isAccepted ? "Answer Un-accepted" : "Answer Accepted!",
                description: answerToAccept.isAccepted ? "You've removed the solution mark." : "You've marked this answer as the solution.",
            });
        } catch (error) {
            console.error("Error accepting answer: ", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not accept the answer. Please try again.",
            });
        }
    };
    
    if (!post) {
        return <div>Loading...</div>;
    }

    const UserLink = ({ authorId, children }: { authorId: string, children: React.ReactNode }) => {
        return authorId ? <Link href={`/users/${authorId}`} className="hover:underline">{children}</Link> : <>{children}</>;
    };
    
    const groupedTags = post.tags?.reduce((acc, tag) => {
    if (!acc[tag.class]) {
        acc[tag.class] = [];
    }
    acc[tag.class].push(tag.topic);
    return acc;
    }, {} as Record<string, string[]>);


    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{post.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                             <UserLink authorId={post.authorId}>
                                <AvatarImage src={post.avatar} />
                            </UserLink>
                            <AvatarFallback>{post.fallback}</AvatarFallback>
                        </Avatar>
                        <UserLink authorId={post.authorId}>
                            <span>{post.author}</span>
                        </UserLink>
                        <span>&middot;</span>
                        <span>{post.date && new Date(post.date.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    {groupedTags && Object.keys(groupedTags).length > 0 && (
                        <div className="mb-4">
                            {Object.entries(groupedTags).map(([className, topics]) => (
                                <div key={className} className="flex items-baseline gap-2 mb-2">
                                    <h4 className="font-semibold">{className}:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {topics.map(topic => <Badge key={topic} variant="secondary">{topic}</Badge>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {post.attachmentURL && (
                        <div className="mb-4">
                            <a href={post.attachmentURL} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline">
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    {post.attachmentName || 'View Attachment'}
                                </Button>
                            </a>
                        </div>
                    )}
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
                 <CardFooter className="flex justify-end">
                     <VoteButtons
                        upvotes={post.upvotes || 0}
                        downvotes={post.downvotes || 0}
                        onUpvote={() => handlePostVote('up')}
                        onDownvote={() => handlePostVote('down')}
                        userVote={postUserVote}
                     />
                </CardFooter>
            </Card>

            <h2 className="text-2xl font-bold font-headline">{answers.length} Answers</h2>

            <div className="grid gap-4">
                {answers.map(answer => (
                    <Card key={answer.id} className={cn(
                        answer.isAccepted && "border-green-500 bg-green-500/5"
                    )}>
                        <CardHeader className="flex flex-row items-start gap-4">
                            <Link href={`/users/${answer.authorId}`}>
                                <Avatar>
                                    <AvatarImage src={answer.avatar} />
                                    <AvatarFallback>{answer.fallback}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserLink authorId={answer.authorId}>
                                            <span className="font-semibold">{answer.author}</span>
                                        </UserLink>
                                        <span className="text-sm text-muted-foreground">&middot; {answer.date && new Date(answer.date.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                    {answer.isAccepted && (
                                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                            Accepted Answer
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2">{answer.content}</p>
                                 {answer.attachmentURL && (
                                    <div className="mt-4">
                                        <a href={answer.attachmentURL} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <Paperclip className="mr-2 h-4 w-4" />
                                                {answer.attachmentName || 'View Attachment'}
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                         <CardFooter className="flex justify-end gap-2">
                             {user?.uid === post.authorId && (
                                <Button variant="outline" size="sm" onClick={() => handleAcceptAnswer(answer)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {answer.isAccepted ? 'Unaccept' : 'Accept'}
                                </Button>
                             )}
                            <VoteButtons
                                upvotes={answer.upvotes || 0}
                                downvotes={answer.downvotes || 0}
                                onUpvote={() => handleAnswerVote(answer, 'up')}
                                onDownvote={() => handleAnswerVote(answer, 'down')}
                                userVote={userVotes[answer.id]}
                           />
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Answer</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Textarea placeholder="Type your answer here." rows={5} value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
                    <div>
                        <Input id="attachment-answer" type="file" onChange={handleFileChange} />
                         {attachment && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                                <FileIcon className="h-4 w-4" />
                                <span>{attachment.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachment(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePostAnswer} disabled={!user}>Post Answer</Button>
                </CardFooter>
            </Card>

            <CommentsSection contentId={id} contentType="question" contentAuthorId={post.authorId} />
        </div>
    )
}
