
"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { summarizeNote, type SummarizeNoteOutput } from "@/ai/flows/summarize-note-flow"
import { generateFlashcards, type Flashcard } from "@/ai/flows/generate-flashcards-flow"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bot, Sparkles, List, Copy, ChevronsUpDown, Check } from "lucide-react"

interface Note {
  title: string;
  subject: string;
  date: string;
  content: string;
}

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState<Note | null>(null);
  const [summary, setSummary] = useState<SummarizeNoteOutput | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [showFlashcardsDialog, setShowFlashcardsDialog] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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
    }
    setIsSummarizing(false);
  };

  const handleGenerateFlashcards = async () => {
    if (!note) return;
    setIsGeneratingFlashcards(true);
    setShowFlashcardsDialog(true);
    setFlashcards([]);
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    try {
        const generatedCards = await generateFlashcards({ noteContent: note.content });
        setFlashcards(generatedCards.flashcards);
    } catch(error) {
        console.error("Error generating flashcards", error);
    }
    setIsGeneratingFlashcards(false);
  }

  const handleNextCard = () => {
    if (currentFlashcardIndex < flashcards.length - 1) {
        setCurrentFlashcardIndex(currentFlashcardIndex + 1);
        setIsFlipped(false);
    }
  }

  const handlePrevCard = () => {
    if (currentFlashcardIndex > 0) {
        setCurrentFlashcardIndex(currentFlashcardIndex - 1);
        setIsFlipped(false);
    }
  }


  if (!note) {
    return <div>Loading...</div>;
  }

  const currentCard = flashcards[currentFlashcardIndex];

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
            <div className="flex gap-2">
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

                <Dialog open={showFlashcardsDialog} onOpenChange={setShowFlashcardsDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" onClick={handleGenerateFlashcards} disabled={isGeneratingFlashcards}>
                            <Copy className="mr-2 h-4 w-4" />
                            {isGeneratingFlashcards ? "Generating..." : "Generate Flashcards"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                         <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                               <Sparkles className="h-5 w-5 text-accent" />
                               AI-Generated Flashcards
                            </DialogTitle>
                            <DialogDescription>
                                Review key concepts from your note with these flashcards.
                            </DialogDescription>
                        </DialogHeader>
                        {isGeneratingFlashcards ? (
                             <div className="flex flex-col items-center justify-center p-8 gap-4 h-64">
                                <Bot className="h-8 w-8 animate-spin" />
                                <p className="text-muted-foreground">Generating your flashcards...</p>
                            </div>
                        ) : flashcards.length > 0 ? (
                            <div className="space-y-4">
                               <Card className="h-64 flex items-center justify-center p-6 text-center cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                                    <p className="text-xl font-semibold">
                                        {isFlipped ? currentCard.answer : currentCard.question}
                                    </p>
                               </Card>
                               <div className="flex justify-between items-center">
                                    <Button variant="outline" onClick={handlePrevCard} disabled={currentFlashcardIndex === 0}>Previous</Button>
                                    <div className="text-sm text-muted-foreground">
                                        Card {currentFlashcardIndex + 1} of {flashcards.length}
                                        <ChevronsUpDown className="inline h-4 w-4 ml-1 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}/>
                                    </div>
                                    <Button variant="outline" onClick={handleNextCard} disabled={currentFlashcardIndex === flashcards.length - 1}>Next</Button>
                               </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 gap-4 h-64">
                                <p className="text-muted-foreground">Sorry, I couldn't generate flashcards for this note.</p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
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

    