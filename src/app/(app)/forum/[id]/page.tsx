
"use client"
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp } from "lucide-react";

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
}

export default function ForumPostPage({ params }: { params: { id: string } }) {
    const [post, setPost] = useState<Post | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswer, setNewAnswer] = useState("");
    const [user] = useAuthState(auth);

    const fetchPostAndAnswers = async () => {
        const postDoc = doc(db, "questions", params.id);
        const postSnapshot = await getDoc(postDoc);
        if (postSnapshot.exists()) {
            const postData = postSnapshot.data();
            setPost({ id: postSnapshot.id, ...postData } as Post);
        }

        const answersCollection = collection(db, "questions", params.id, "answers");
        const answersSnapshot = await getDocs(answersCollection);
        const answersList = answersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer)).sort((a, b) => b.date - a.date);
        setAnswers(answersList);
    };

    useEffect(() => {
        const incrementViewCount = async () => {
             const postRef = doc(db, "questions", params.id);
             await updateDoc(postRef, {
                views: increment(1)
            });
        }
        incrementViewCount();
        fetchPostAndAnswers();
    }, [params.id]);

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
            await addDoc(collection(db, "questions", params.id, "answers"), {
                author: authorName,
                avatar: authorAvatar,
                fallback: authorFallback,
                content: newAnswer,
                date: serverTimestamp(),
                upvotes: 0,
                authorId: user.uid,
            });

            const questionRef = doc(db, "questions", params.id);
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
            alert("You must be logged in to upvote.");
            return;
        }

        if (user.uid === post?.authorId) {
            alert("You cannot upvote your own question.");
            return;
        }

        try {
            const questionRef = doc(db, "questions", params.id);
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
            alert("You must be logged in to upvote.");
            return;
        }

        if (user.uid === answer.authorId) {
            alert("You cannot upvote your own answer.");
            return;
        }

        try {
            const answerRef = doc(db, "questions", params.id, "answers", answer.id);
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
    
    if (!post) {
        return <div>Loading...</div>;
    }

    const UserLink = ({ authorId, children }: { authorId: string, children: React.ReactNode }) => {
        return authorId ? <Link href={`/users/${authorId}`} className="hover:underline">{children}</Link> : <>{children}</>;
    };

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
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleUpvoteQuestion}>
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {post.upvotes}
                    </Button>
                </CardFooter>
            </Card>

            <h2 className="text-2xl font-bold font-headline">{answers.length} Answers</h2>

            <div className="grid gap-4">
                {answers.map(answer => (
                    <Card key={answer.id}>
                        <CardHeader className="flex flex-row items-start gap-4">
                            <Link href={`/users/${answer.authorId}`}>
                                <Avatar>
                                    <AvatarImage src={answer.avatar} />
                                    <AvatarFallback>{answer.fallback}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                     <UserLink authorId={answer.authorId}>
                                        <span className="font-semibold">{answer.author}</span>
                                    </UserLink>
                                    <span className="text-sm text-muted-foreground">&middot; {answer.date && new Date(answer.date.seconds * 1000).toLocaleDateString()}</span>
                                </div>
                                <p className="mt-2">{answer.content}</p>
                            </div>
                        </CardHeader>
                         <CardFooter className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleUpvoteAnswer(answer)}>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                {answer.upvotes}
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
