
"use client"
import { useEffect, useState } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment, writeBatch, runTransaction, query, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useVote } from "@/hooks/use-vote";

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

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

function AnswerComponent({ answer, postId, postAuthorId }: { answer: Answer, postId: string, postAuthorId: string }) {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const { upvotes, downvotes, userVote, handleVote } = useVote({
        contentType: 'answer',
        contentId: answer.id,
        authorId: answer.authorId,
        initialUpvotes: answer.upvotes,
        initialDownvotes: answer.downvotes,
        points: { up: 5, down: 0 },
        collectionPath: `questions/${postId}/answers`,
    });

    const handleAcceptAnswer = async (answerToAccept: Answer) => {
        if (!user || user.uid !== postAuthorId || !db) return;

        try {
            await runTransaction(db, async (transaction) => {
                const isAccepting = !answerToAccept.isAccepted;
                const questionRef = doc(db, "questions", postId);
                const questionDoc = await transaction.get(questionRef);
                const answersRef = collection(db, "questions", postId, "answers");
                const answersQuery = query(answersRef);
                const answersSnapshot = await getDocs(answersQuery);

                for (const answerDoc of answersSnapshot.docs) {
                    const currentAnswer = { id: answerDoc.id, ...answerDoc.data() } as Answer;
                    const answerRef = doc(db, "questions", postId, "answers", currentAnswer.id);
                    if (currentAnswer.id === answerToAccept.id) {
                        transaction.update(answerRef, { isAccepted: isAccepting });
                    } else if (currentAnswer.isAccepted) {
                        transaction.update(answerRef, { isAccepted: false });
                    }
                }
                
                const answerAuthorRef = doc(db, "users", answerToAccept.authorId);
                const questionAuthorRef = doc(db, "users", postAuthorId);

                transaction.update(answerAuthorRef, { points: increment(isAccepting ? 25 : -25) });
                transaction.update(questionAuthorRef, { points: increment(isAccepting ? 5 : -5) });
            });

            toast({
                title: !answerToAccept.isAccepted ? "Answer Accepted!" : "Answer Un-accepted",
                description: !answerToAccept.isAccepted ? "You've marked this answer as the solution." : "You've removed the solution mark.",
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

    return (
        <Card className={cn(answer.isAccepted && "border-green-500 bg-green-500/5")}>
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
                            <Link href={`/users/${answer.authorId}`} className="hover:underline">
                                <span className="font-semibold">{answer.author}</span>
                            </Link>
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
                 {user?.uid === postAuthorId && (
                    <Button variant="outline" size="sm" onClick={() => handleAcceptAnswer(answer)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {answer.isAccepted ? 'Unaccept' : 'Accept'}
                    </Button>
                 )}
                <VoteButtons
                    upvotes={upvotes}
                    downvotes={downvotes}
                    onUpvote={() => handleVote('up')}
                    onDownvote={() => handleVote('down')}
                    userVote={userVote}
               />
            </CardFooter>
        </Card>
    );
}


export default function ForumPostPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [post, setPost] = useState<Post | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswer, setNewAnswer] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [user] = auth ? useAuthState(auth) : [null];
    const { toast } = useToast();

    const postVote = useVote({
        contentType: 'question',
        contentId: id,
        authorId: post?.authorId || '',
        initialUpvotes: post?.upvotes || 0,
        initialDownvotes: post?.downvotes || 0,
        points: { up: 2, down: 0 },
        collectionPath: 'questions',
    });
    
    useEffect(() => {
        if (!id || !db) return;
        
        const postUnsubscribe = onSnapshot(doc(db, "questions", id), (postSnapshot) => {
            if (postSnapshot.exists()) {
                setPost({ id: postSnapshot.id, ...postSnapshot.data() } as Post);
            }
        });

        const answersCollection = collection(db, "questions", id, "answers");
        const answersQuery = query(answersCollection, orderBy("date", "desc"));
        const answersUnsubscribe = onSnapshot(answersQuery, (answersSnapshot) => {
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
        });

        const incrementViewCount = async () => {
             const postRef = doc(db, "questions", id);
             await updateDoc(postRef, { views: increment(1) }).catch(err => {}); // Fail silently
        }
        incrementViewCount();

        return () => {
            postUnsubscribe();
            answersUnsubscribe();
        };
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast({ variant: "destructive", title: "File too large", description: `Please select a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
                e.target.value = '';
                setAttachment(null);
                return;
            }
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                toast({ variant: "destructive", title: "Invalid file type", description: "Please select a PNG, JPG, or PDF file." });
                e.target.value = '';
                setAttachment(null);
                return;
            }
            setAttachment(file);
        }
    };
    const handlePostAnswer = async () => {
        if (!newAnswer.trim() || !user || !post || !db || !storage) return;

        try {
            const newAnswerRef = await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw "User does not exist!";

                const userData = userDoc.data();
                const authorName = `${userData.firstName} ${userData.lastName}`;
                const authorFallback = `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`;
                const authorAvatar = userData.photoURL || "";

                transaction.update(userDocRef, { points: increment(15) });
                transaction.update(doc(db, "questions", id), { replies: increment(1) });
                
                const answerRef = doc(collection(db, "questions", id, "answers"));
                transaction.set(answerRef, {
                    author: authorName,
                    avatar: authorAvatar,
                    fallback: authorFallback,
                    content: newAnswer,
                    date: serverTimestamp(),
                    upvotes: 0,
                    downvotes: 0,
                    authorId: user.uid,
                    isAccepted: false,
                    attachmentURL: "",
                    attachmentName: attachment?.name || "",
                });

                if (post.authorId && post.authorId !== user.uid && userData.notificationPreferences?.answersOnQuestions) {
                    const notificationRef = doc(collection(db, 'users', post.authorId, 'notifications'));
                    transaction.set(notificationRef, {
                        type: 'new_answer',
                        message: `${authorName} answered your question: "${post.title}"`,
                        link: `/forum/${id}`,
                        isRead: false,
                        date: serverTimestamp(),
                    });
                }
                return answerRef;
            });

            if (attachment) {
                 const storageRef = ref(storage, `attachments/answers/${user.uid}/${newAnswerRef.id}_${attachment.name}`);
                await uploadBytes(storageRef, attachment);
                const attachmentURL = await getDownloadURL(storageRef);
                await updateDoc(newAnswerRef, { attachmentURL });
            }

            setNewAnswer("");
            setAttachment(null);
        } catch (error) {
            console.error("Error posting answer: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not post your answer." });
        }
    };

    if (!post) {
        return <div>Loading...</div>;
    }

    const UserLink = ({ authorId, children }: { authorId: string, children: React.ReactNode }) => {
        return authorId ? <Link href={`/users/${authorId}`} className="hover:underline">{children}</Link> : <>{children}</>;
    };
    
    const groupedTags = post.tags?.reduce((acc, tag) => {
        if (!acc[tag.class]) acc[tag.class] = [];
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
                        upvotes={postVote.upvotes}
                        downvotes={postVote.downvotes}
                        onUpvote={() => postVote.handleVote('up')}
                        onDownvote={() => postVote.handleVote('down')}
                        userVote={postVote.userVote}
                     />
                </CardFooter>
            </Card>

            <h2 className="text-2xl font-bold font-headline">{answers.length} Answers</h2>

            <div className="grid gap-4">
                {answers.map(answer => (
                    <AnswerComponent key={answer.id} answer={answer} postId={id} postAuthorId={post.authorId} />
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Answer</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Textarea placeholder="Type your answer here." rows={5} value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
                    <div>
                        <Input id="attachment-answer" type="file" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} />
                         {attachment && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                                <FileIcon className="h-4 w-4" />
                                <span>{attachment.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => {
                                    setAttachment(null);
                                    (document.getElementById('attachment-answer') as HTMLInputElement).value = '';
                                }}>
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

    