
"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot } from "lucide-react"

interface Note {
  title: string;
  subject: string;
  date: string;
  content: string;
}

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      const noteDoc = doc(db, "notes", params.id);
      const noteSnapshot = await getDoc(noteDoc);
      if (noteSnapshot.exists()) {
        setNote(noteSnapshot.data() as Note);
      }
    };

    fetchNote();
  }, [params.id]);

  if (!note) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline text-3xl">{note.title}</CardTitle>
              <CardDescription>
                Subject: {note.subject} | Created on: {new Date(note.date).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p style={{ whiteSpace: 'pre-line' }}>{note.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
