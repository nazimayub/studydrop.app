
"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot, increment } from "firebase/firestore"
import { db, auth } from "@/lib/firebase/firebase"
import Link from "next/link"
import { useVote } from "@/hooks/use-vote"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoteButtons } from "@/components/app/vote-buttons"
import { CommentsSection } from "@/components/app/comments-section"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import placeholderImages from "@/lib/placeholder-images.json"

interface NoteTag {
    class: string;
    topic: string;
}

interface Note {
  title: string;
  subject: string;
  date: string;
  content: string;
  authorId: string;
  authorName: string;
  tags?: NoteTag[];
  upvotes?: number;
  downvotes?: number;
  attachmentURL?: string;
  attachmentName?: string;
}

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [note, setNote] = useState<Note | null>(null);

  const { upvotes, downvotes, userVote, handleVote } = useVote({
    contentType: 'note',
    contentId: id,
    authorId: note?.authorId || '',
    initialUpvotes: note?.upvotes || 0,
    initialDownvotes: note?.downvotes || 0,
    points: { up: 2, down: 0 },
    collectionPath: 'notes',
  });

  useEffect(() => {
    if (!id || !db) return;
    const noteDocRef = doc(db, "notes", id);
    const unsubscribe = onSnapshot(noteDocRef, (noteSnapshot) => {
         if (noteSnapshot.exists()) {
            const noteData = noteSnapshot.data() as Note;
            setNote(noteData);
        }
    });
    return () => unsubscribe();
  }, [id]);

  if (!note) {
    return <div>Loading...</div>;
  }
  
  const groupedTags = note.tags?.reduce((acc, tag) => {
    if (!acc[tag.class]) {
        acc[tag.class] = [];
    }
    acc[tag.class].push(tag.topic);
    return acc;
    }, {} as Record<string, string[]>);


  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-3xl">{note.title}</CardTitle>
              <CardDescription>
                Created on: {note.date ? new Date(note.date).toLocaleDateString() : '...'} by{" "}
                {note.authorId ? (
                   <Link href={`/users/${note.authorId}`} className="font-medium text-primary hover:underline">{note.authorName}</Link>
                ) : (
                    <span>{note.authorName}</span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
            </div>

          </div>
        </CardHeader>
        <CardContent>
             {groupedTags && Object.keys(groupedTags).length > 0 && (
                <div className="mb-4">
                    {Object.entries(groupedTags).map(([className, topics]) => (
                        <div key={className} className="flex items-baseline gap-2 mb-2">
                            <h4 className="font-semibold">{className}:</h4>
                            <div className="flex flex-wrap gap-1">
                                {topics.map(topic => <Badge key={topic} variant="secondary">{topic}</Badge>)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          <div className="mb-4">
              <Carousel className="w-full">
                <CarouselContent>
                  {placeholderImages.noteScreenshots.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex aspect-[16/9] items-center justify-center p-0 overflow-hidden rounded-lg">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              width={image.width}
                              height={image.height}
                              data-ai-hint={image['data-ai-hint']}
                              className="object-cover w-full h-full"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <p style={{ whiteSpace: 'pre-line' }}>{note.content}</p>
          </div>
        </CardContent>
         <CardFooter className="flex flex-col items-start gap-4">
             <VoteButtons
                upvotes={upvotes}
                downvotes={downvotes}
                onUpvote={() => handleVote('up')}
                onDownvote={() => handleVote('down')}
                userVote={userVote}
             />
        </CardFooter>
      </Card>
      
      {note.authorId && <CommentsSection contentId={id} contentType="note" contentAuthorId={note.authorId} />}
    </div>
  )
}
