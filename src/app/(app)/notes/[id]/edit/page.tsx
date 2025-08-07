
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

interface Note {
  title: string;
  subject: string;
  class: string;
  content: string;
  isPublic?: boolean;
}

export default function EditNotePage({ params }: { params: { id: string } }) {
    const [note, setNote] = useState<Note | null>(null);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [noteClass, setNoteClass] = useState("");
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
                setSubject(noteData.subject);
                setNoteClass(noteData.class);
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
                subject,
                class: noteClass,
                content,
                isPublic: true
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
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleUpdateNote}>Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
