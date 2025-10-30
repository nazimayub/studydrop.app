"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { BookCopy } from "lucide-react";
import { generateStudyGuide, type StudyGuide } from "@/ai/flows/study-guide-flow";

export default function StudyGuidePage() {
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [guide, setGuide] = useState<StudyGuide | null>(null);

    const handleSubmit = async () => {
        if (!topic.trim()) {
            alert("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setGuide(null);

        try {
            const result = await generateStudyGuide({ topic });
            setGuide(result);
        } catch (error) {
            console.error("Error generating study guide:", error);
            alert("Sorry, there was an error generating the study guide. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">AI Study Guide Creator</h1>
                <p className="text-muted-foreground">Enter any topic and get a customized study guide with key concepts and practice questions.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create Your Guide</CardTitle>
                    <CardDescription>What topic do you want to master today?</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="e.g., Photosynthesis, The French Revolution, Python Lists"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        disabled={isLoading}
                    />
                </CardContent>
                <CardFooter>
                    <LoadingButton loading={isLoading} onClick={handleSubmit}>
                        <BookCopy className="mr-2 h-4 w-4" />
                        Generate Guide
                    </LoadingButton>
                </CardFooter>
            </Card>

            {guide && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Your Study Guide for: {topic}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold mb-4 font-headline">Key Concepts</h3>
                            <div className="prose dark:prose-invert max-w-none space-y-4">
                                {guide.concepts.map((concept, index) => (
                                    <div key={index}>
                                        <h4 className="font-semibold">{concept.title}</h4>
                                        <p>{concept.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                         <section>
                            <h3 className="text-xl font-bold mb-4 font-headline">Practice Questions</h3>
                            <div className="prose dark:prose-invert max-w-none space-y-4">
                                <ul className="list-decimal pl-5">
                                    {guide.practiceQuestions.map((question, index) => (
                                        <li key={index} className="mb-2">{question}</li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
