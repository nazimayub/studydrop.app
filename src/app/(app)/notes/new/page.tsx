
"use client"

import { useState } from "react";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewNotePage() {
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [noteClass, setNoteClass] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [user] = useAuthState(auth);

    const handleCreateNote = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        setIsLoading(true);

        try {
            await addDoc(collection(db, "notes"), {
                title,
                subject,
                class: noteClass,
                content,
                date: new Date().toISOString(),
                status: "Published",
                authorId: user.uid,
                authorName: user.displayName || "Anonymous",
                isPublic: true,
            });
            
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                points: increment(10)
            });

            router.push("/notes");
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
                    <CardTitle className="font-headline text-3xl">Add New Note</CardTitle>
                    <CardDescription>Fill out the form below to create a new note. All notes are public.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="e.g. Physics, History" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="class">Class</Label>
                        <Input id="class" placeholder="e.g. PHYS 101, HIST 230" value={noteClass} onChange={(e) => setNoteClass(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" placeholder="Write your note here..." rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleCreateNote} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Note"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
