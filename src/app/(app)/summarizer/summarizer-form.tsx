"use client";

import { useState } from "react";
import { useSearchParams } from 'next/navigation';
import { summarizeNotes } from "@/ai/flows/summarize-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, Sparkles } from "lucide-react";

export function SummarizerForm() {
  const searchParams = useSearchParams();
  const initialNotes = searchParams.get('notes') || '';
  const [notes, setNotes] = useState(initialNotes);
  const [summary, setSummary] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSummary("");
    setReasoning("");
    try {
      const result = await summarizeNotes({ notes });
      if (result) {
        setSummary(result.summary);
        setReasoning(result.reasoning || "No reasoning provided.");
      } else {
         setError("Failed to get a summary. The AI returned an empty result.");
      }
    } catch (err) {
      setError("An error occurred while summarizing the notes. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Paste your notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={15}
          className="font-code"
          disabled={isLoading}
        />
        <Button type="submit" disabled={!notes || isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              Summarize Notes
            </>
          )}
        </Button>
      </form>
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
      {(summary || reasoning) && (
        <div className="grid gap-6 md:grid-cols-2">
            {summary && (
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{summary}</p>
                </CardContent>
            </Card>
            )}
            {reasoning && (
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                     <Bot className="w-5 h-5 text-primary" />
                    <CardTitle>Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{reasoning}</p>
                </CardContent>
            </Card>
            )}
        </div>
      )}
    </div>
  );
}
