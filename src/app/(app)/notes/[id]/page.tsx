
"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { summarizeNote, type SummarizeNoteOutput } from "@/ai/flows/summarize-note-flow"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bot, Sparkles, List } from "lucide-react"

interface Note {
  title: string;
  subject: string;
  date: string;
  content: string;
}

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState<Note | null>(null);
  const [summary, setSummary] = useState<SummarizeNoteOutput | null>(null);
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
    setSummary(null); // Clear previous summary
    try {
      const noteSummary = await summarizeNote({ noteContent: note.content });
      setSummary(noteSummary);
    } catch (error) {
      console.error("Error summarizing note: ", error);
      // Handle error state in UI if needed
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                           <Sparkles className="h-5 w-5 text-accent" />
                           AI-Generated Summary
                        </DialogTitle>
                        <DialogDescription>
                            Here is a breakdown of your note's key points.
                        </DialogDescription>
                    </DialogHeader>
                    {isSummarizing ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-4">
                            <Bot className="h-8 w-8 animate-spin" />
                            <p className="text-muted-foreground">Generating your summary...</p>
                        </div>
                    ) : summary ? (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">{summary.title}</h3>
                            <p className="text-sm text-foreground/90">{summary.summary}</p>
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><List className="h-4 w-4"/> Key Points</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {summary.keyPoints.map((point, index) => (
                                        <li key={index}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center p-8 gap-4">
                            <p className="text-muted-foreground">Sorry, I couldn't generate a summary for this note.</p>
                        </div>
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
