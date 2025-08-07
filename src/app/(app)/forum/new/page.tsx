
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function NewQuestionPage() {
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [description, setDescription] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [user] = useAuthState(auth);

    const handlePostQuestion = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        setIsLoading(true);

        let authorName = "Anonymous";
        let authorFallback = "A";
        let authorAvatar = "";

        if (!isAnonymous) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                authorName = `${userData.firstName} ${userData.lastName}`;
                authorFallback = `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`;
                authorAvatar = userData.photoURL || "";
            }
        }


        try {
            await addDoc(collection(db, "questions"), {
                title,
                tags: tags.split(",").map(tag => tag.trim()),
                content: description,
                authorId: isAnonymous ? null : user.uid,
                author: authorName,
                avatar: authorAvatar,
                fallback: authorFallback,
                date: serverTimestamp(),
                views: 0,
                replies: 0,
                upvotes: 0,
            });

            if (!isAnonymous) {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                    points: increment(5)
                });
            }

            router.push("/forum");
        } catch (error) {
            console.error("Error adding document: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Ask a New Question</CardTitle>
                    <CardDescription>Fill out the form below to post your question to the forum.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Question / Title</Label>
                        <Input id="title" placeholder="What is your question?" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input id="tags" placeholder="e.g. physics, javascript, history" value={tags} onChange={(e) => setTags(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Add more details about your question..." rows={10} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(e) => setIsAnonymous(e === true)} />
                        <Label htmlFor="anonymous">Post anonymously</Label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handlePostQuestion} disabled={isLoading}>
                       {isLoading ? "Posting..." : "Post Question"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
