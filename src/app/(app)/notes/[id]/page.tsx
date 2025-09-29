
"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, updateDoc, increment, runTransaction } from "firebase/firestore"
import { db, auth } from "@/lib/firebase/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import Link from "next/link"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoteButtons } from "@/components/app/vote-buttons"
import { CommentsSection } from "@/components/app/comments-section"
import { useToast } from "@/hooks/use-toast"

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
  votedBy?: string[];
}

interface UserVote {
    type: 'upvote' | 'downvote';
    userId: string;
}

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [user] = useAuthState(auth);
  const [note, setNote] = useState<Note | null>(null);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const { toast } = useToast();

  const fetchNote = async () => {
    const noteDoc = doc(db, "notes", id);
    const noteSnapshot = await getDoc(noteDoc);
    if (noteSnapshot.exists()) {
        const noteData = noteSnapshot.data() as Note;
        setNote(noteData);
        if (user) {
            const userVoteDocRef = doc(db, "users", user.uid, "votes", `note-${id}`);
            const userVoteDoc = await getDoc(userVoteDocRef);
            if (userVoteDoc.exists()) {
                setUserVote(userVoteDoc.data().type);
            } else {
                setUserVote(null);
            }
        }
    }
  };

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id, user]);

  
  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
        toast({ variant: "destructive", title: "Login Required" });
        return;
    }
    if (!note || user.uid === note.authorId) {
        toast({ variant: "destructive", description: "You cannot vote on your own note." });
        return;
    }

    const noteRef = doc(db, "notes", id);
    const userVoteRef = doc(db, "users", user.uid, "votes", `note-${id}`);
    const authorRef = doc(db, "users", note.authorId);

    try {
        await runTransaction(db, async (transaction) => {
            const userVoteDoc = await transaction.get(userVoteRef);
            const noteDoc = await transaction.get(noteRef);

            if (!noteDoc.exists()) {
                throw "Note does not exist!";
            }

            const currentVote = userVoteDoc.exists() ? userVoteDoc.data().type : null;
            let noteUpdate: any = {};
            let pointsChange = 0;

            if (currentVote === voteType) {
                // Undoing vote
                transaction.delete(userVoteRef);
                if (voteType === 'up') {
                    noteUpdate.upvotes = increment(-1);
                    pointsChange = -2;
                } else {
                    noteUpdate.downvotes = increment(-1);
                }
                setUserVote(null); // Optimistic update
            } else {
                // New vote or changing vote
                transaction.set(userVoteRef, { type: voteType });
                if (currentVote === 'up') {
                    noteUpdate.upvotes = increment(-1);
                    pointsChange = -2;
                } else if (currentVote === 'down') {
                    noteUpdate.downvotes = increment(-1);
                }

                if (voteType === 'up') {
                    noteUpdate.upvotes = increment(1);
                    pointsChange += 2;
                } else {
                    noteUpdate.downvotes = increment(1);
                }
                 setUserVote(voteType); // Optimistic update
            }
            
            transaction.update(noteRef, noteUpdate);
            if (pointsChange !== 0) {
                transaction.update(authorRef, { points: increment(pointsChange) });
            }
        });

        await fetchNote(); // Re-fetch to get the final state from the server
    } catch (error) {
        console.error(`Error ${voteType}ing note:`, error);
        toast({ variant: "destructive", title: "Error", description: "Your vote could not be recorded." });
        await fetchNote(); // Fetch note to revert optimistic UI updates on error
    }
};


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
          <div className="prose dark:prose-invert max-w-none">
            <p style={{ whiteSpace: 'pre-line' }}>{note.content}</p>
          </div>
        </CardContent>
         <CardFooter className="flex flex-col items-start gap-4">
             <VoteButtons
                upvotes={note.upvotes || 0}
                downvotes={note.downvotes || 0}
                onUpvote={() => handleVote('up')}
                onDownvote={() => handleVote('down')}
                userVote={userVote}
             />
        </CardFooter>
      </Card>
      
      <CommentsSection contentId={id} contentType="note" contentAuthorId={note.authorId} />
    </div>
  )
}
