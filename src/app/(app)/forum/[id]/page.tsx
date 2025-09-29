
"use client"
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, updateDoc, increment, writeBatch } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    tags?: PostTag[];
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
    isAccepted?: boolean;
}

export default function ForumPostPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [post, setPost] = useState<Post | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswer, setNewAnswer] = useState("");
    const [user] = useAuthState(auth);
    const { toast } = useToast();

    const fetchPostAndAnswers = async () => {
        if (!id) return;
        const postDoc = doc(db, "questions", id);
        const postSnapshot = await getDoc(postDoc);
        if (postSnapshot.exists()) {
            const postData = postSnapshot.data();
            setPost({ id: postSnapshot.id, ...postData } as Post);
        }

        const answersCollection = collection(db, "questions", id, "answers");
        const answersSnapshot = await getDocs(answersCollection);
        const answersList = answersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer)).sort((a, b) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            // Fallback to sorting by date if acceptance status is the same
            if (b.date && a.date) {
               return b.date.seconds - a.date.seconds;
            }
            return 0;
        });
        setAnswers(answersList);
    };

    useEffect(() => {
        const incrementViewCount = async () => {
             const postRef = doc(db, "questions", id);
             await updateDoc(postRef, {
                views: increment(1)
            });
        }
        if (id) {
            incrementViewCount();
            fetchPostAndAnswers();
        }
    }, [id]);

    const handlePostAnswer = async () => {
        if (!newAnswer.trim() || !user) return;

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
            await addDoc(collection(db, "questions", id, "answers"), {
                author: authorName,
                avatar: authorAvatar,
                fallback: authorFallback,
                content: newAnswer,
                date: serverTimestamp(),
                upvotes: 0,
                authorId: user.uid,
                isAccepted: false,
            });

            const questionRef = doc(db, "questions", id);
            await updateDoc(questionRef, {
                replies: increment(1)
            });


            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                points: increment(15)
            });

            setNewAnswer("");
            fetchPostAndAnswers();
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };
    
    const handleUpvoteQuestion = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Login Required",
                description: "You must be logged in to upvote.",
            });
            return;
        }

        if (user.uid === post?.authorId) {
            toast({
                variant: "destructive",
                description: "You cannot upvote your own question.",
            });
            return;
        }

        try {
            const questionRef = doc(db, "questions", id);
            await updateDoc(questionRef, {
                upvotes: increment(1)
            });

            if (post?.authorId) {
                const authorRef = doc(db, "users", post.authorId);
                await updateDoc(authorRef, {
                    points: increment(2) 
                });
            }

            fetchPostAndAnswers();
        } catch (error) {
            console.error("Error upvoting question: ", error);
        }
    };


    const handleUpvoteAnswer = async (answer: Answer) => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Login Required",
                description: "You must be logged in to upvote.",
            });
            return;
        }

        if (user.uid === answer.authorId) {
             toast({
                variant: "destructive",
                description: "You cannot upvote your own answer.",
            });
            return;
        }

        try {
            const answerRef = doc(db, "questions", id, "answers", answer.id);
            await updateDoc(answerRef, {
                upvotes: increment(1)
            });

            if (answer.authorId) {
                const authorRef = doc(db, "users", answer.authorId);
                await updateDoc(authorRef, {
                    points: increment(5)
                });
            }

            fetchPostAndAnswers(); 
        } catch (error) {
            console.error("Error upvoting answer: ", error);
        }
    };

     const handleAcceptAnswer = async (answerToAccept: Answer) => {
        if (!user || user.uid !== post?.authorId) return;

        const batch = writeBatch(db);

        answers.forEach(answer => {
            const answerRef = doc(db, "questions", id, "answers", answer.id);
            if (answer.id === answerToAccept.id) {
                batch.update(answerRef, { isAccepted: true });
            } else if (answer.isAccepted) {
                batch.update(answerRef, { isAccepted: false });
            }
        });

        // Award points to the answer author
        if (answerToAccept.authorId) {
            const authorRef = doc(db, "users", answerToAccept.authorId);
            batch.update(authorRef, { points: increment(25) });
        }
        
        try {
            await batch.commit();
            toast({
                title: "Answer Accepted!",
                description: "You've marked this answer as the solution.",
            });
            fetchPostAndAnswers();
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
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleUpvoteQuestion}>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {post.upvotes || 0}
                    </Button>
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
                            </div>
                        </CardHeader>
                         <CardFooter className="flex justify-end gap-2">
                             {user?.uid === post.authorId && !answer.isAccepted && (
                                <Button variant="outline" size="sm" onClick={() => handleAcceptAnswer(answer)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                             )}
                            <Button variant="ghost" size="sm" onClick={() => handleUpvoteAnswer(answer)}>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                {answer.upvotes || 0}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Answer</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="Type your answer here." rows={5} value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePostAnswer} disabled={!user}>Post Answer</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
