
"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { summarizeNote } from "@/ai/flows/summarize-note-flow"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bot } from "lucide-react"

interface Note {
  title: string;
  subject: string;
  date: string;
  content: string;
}

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState<Note | null>(null);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

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

  const handleSummarize = async () => {
    if (!note) return;
    setIsSummarizing(true);
    setShowSummaryDialog(true);
    try {
      const noteSummary = await summarizeNote({ noteContent: note.content });
      setSummary(noteSummary);
    } catch (error) {
      console.error("Error summarizing note: ", error);
      setSummary("Sorry, I couldn't generate a summary for this note.");
    }
    setIsSummarizing(false);
  };


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
             <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
                <DialogTrigger asChild>
                    <Button onClick={handleSummarize} disabled={isSummarizing}>
                        <Bot className="mr-2 h-4 w-4" />
                        {isSummarizing ? "Summarizing..." : "Summarize with AI"}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Note Summary</DialogTitle>
                        <DialogDescription>
                            Here is an AI-generated summary of your note.
                        </DialogDescription>
                    </DialogHeader>
                    {isSummarizing ? (
                        <div className="flex items-center justify-center p-8">
                            <Bot className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <p>{summary}</p>
                    )}
                </DialogContent>
            </Dialog>
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
