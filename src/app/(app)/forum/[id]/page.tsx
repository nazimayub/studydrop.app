
"use client"
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp } from "lucide-react";

interface Post {
    id: string;
    title: string;
    author: string;
    avatar: string;
    fallback: string;
    date: any;
    content: string;
}

interface Answer {
    id: string;
    author: string;
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

    useEffect(() => {
        const fetchPostAndAnswers = async () => {
            const postDoc = doc(db, "questions", params.id);
            const postSnapshot = await getDoc(postDoc);
            if (postSnapshot.exists()) {
                const postData = postSnapshot.data();
                setPost({ id: postSnapshot.id, ...postData } as Post);
            }

            const answersCollection = collection(db, "questions", params.id, "answers");
            const answersSnapshot = await getDocs(answersCollection);
            const answersList = answersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
            setAnswers(answersList);
        };

        fetchPostAndAnswers();
    }, [params.id]);

    const handlePostAnswer = async () => {
        if (!newAnswer.trim()) return;

        try {
            await addDoc(collection(db, "questions", params.id, "answers"), {
                author: "Anonymous", // Replace with actual user later
                avatar: "https://placehold.co/40x40.png",
                fallback: "A",
                content: newAnswer,
                date: serverTimestamp(),
                upvotes: 0,
            });
            setNewAnswer("");
            // Refetch answers
            const answersCollection = collection(db, "questions", params.id, "answers");
            const answersSnapshot = await getDocs(answersCollection);
            const answersList = answersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
            setAnswers(answersList);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };
    
    if (!post) {
        return <div>Loading...</div>;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{post.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={post.avatar} />
                            <AvatarFallback>{post.fallback}</AvatarFallback>
                        </Avatar>
                        <span>{post.author}</span>
                        <span>&middot;</span>
                        <span>{post.date && new Date(post.date.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold font-headline">{answers.length} Answers</h2>

            <div className="grid gap-4">
                {answers.map(answer => (
                    <Card key={answer.id}>
                        <CardHeader className="flex flex-row items-start gap-4">
                             <Avatar>
                                <AvatarImage src={answer.avatar} />
                                <AvatarFallback>{answer.fallback}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{answer.author}</span>
                                    <span className="text-sm text-muted-foreground">&middot; {answer.date && new Date(answer.date.seconds * 1000).toLocaleDateString()}</span>
                                </div>
                                <p className="mt-2">{answer.content}</p>
                            </div>
                        </CardHeader>
                         <CardFooter className="flex justify-end">
                            <Button variant="ghost" size="sm">
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
                    <Button onClick={handlePostAnswer}>Post Answer</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
