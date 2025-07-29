import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SummarizerForm } from "./summarizer-form";

export default function SummarizerPage() {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">AI Note Summarizer</CardTitle>
            <CardDescription>
                Paste your notes below to get a concise summary and the reasoning behind it.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SummarizerForm />
        </CardContent>
    </Card>
  );
}
