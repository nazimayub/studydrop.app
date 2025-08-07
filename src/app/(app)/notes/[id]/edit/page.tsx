
"use client"

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// We will remove the old note structure and rely on the new one from new/page.tsx
// For now, let's keep it simple and just edit the main fields.
// A more complex edit page would be needed for the new tag structure.
interface Note {
  title: string;
  content: string;
  isPublic?: boolean;
}

export default function EditNotePage({ params }: { params: { id: string } }) {
    const [note, setNote] = useState<Note | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchNote = async () => {
            const noteDoc = doc(db, "notes", params.id);
            const noteSnapshot = await getDoc(noteDoc);
            if (noteSnapshot.exists()) {
                const noteData = noteSnapshot.data() as Note;
                setNote(noteData);
                setTitle(noteData.title);
                setContent(noteData.content);
            } else {
                router.push("/notes");
            }
        };

        fetchNote();
    }, [params.id, router]);

    const handleUpdateNote = async () => {
        try {
            const noteDoc = doc(db, "notes", params.id);
            await updateDoc(noteDoc, {
                title,
                content,
                isPublic: true // All notes are public now
            });
            router.push(`/notes/${params.id}`);
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    if (!note) {
        return <div>Loading...</div>
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Edit Note</CardTitle>
                    <CardDescription>Update the details of your note below.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" placeholder="Write your note here..." rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleUpdateNote}>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
