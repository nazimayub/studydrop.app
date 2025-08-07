
"use client"

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Note {
    id: string;
    title: string;
    subject: string;
}

interface Question {
    id: string;
    title: string;
    author: string;
}

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [notes, setNotes] = useState<Note[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setLoading(false);
                return;
            };

            setLoading(true);

            // Fetch and filter notes
            const notesCollection = collection(db, 'notes');
            const notesSnapshot = await getDocs(notesCollection);
            const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
            const filteredNotes = notesList.filter(note => note.title.toLowerCase().includes(query.toLowerCase()));
            setNotes(filteredNotes);

            // Fetch and filter questions
            const questionsCollection = collection(db, 'questions');
            const questionsSnapshot = await getDocs(questionsCollection);
            const questionsList = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
            const filteredQuestions = questionsList.filter(question => question.title.toLowerCase().includes(query.toLowerCase()));
            setQuestions(filteredQuestions);

            setLoading(false);
        };

        fetchResults();
    }, [query]);

    if (loading) {
        return <div>Loading search results...</div>;
    }

    if (!query) {
        return <div>Please enter a search term.</div>
    }

    const hasResults = notes.length > 0 || questions.length > 0;

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Search Results</h1>
                <p className="text-muted-foreground">Found {notes.length + questions.length} results for "{query}"</p>
            </div>

            {!hasResults ? (
                <p>No results found.</p>
            ) : (
                <div className="grid gap-8">
                    {notes.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Notes</h2>
                            <div className="grid gap-4">
                                {notes.map(note => (
                                    <Card key={note.id}>
                                        <CardHeader>
                                            <Link href={`/notes/${note.id}`} className="hover:underline">
                                                <CardTitle>{note.title}</CardTitle>
                                            </Link>
                                            <CardDescription>Subject: {note.subject}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {questions.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Questions</h2>
                            <div className="grid gap-4">
                                {questions.map(question => (
                                    <Card key={question.id}>
                                        <CardHeader>
                                            <Link href={`/forum/${question.id}`} className="hover:underline">
                                                <CardTitle>{question.title}</CardTitle>
                                            </Link>
                                            <CardDescription>Asked by {question.author}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchResults />
        </Suspense>
    )
}
