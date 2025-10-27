
"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, runTransaction, getDoc, increment, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/firebase";
import { useToast } from "@/hooks/use-toast";

type VoteType = 'up' | 'down';
type ContentType = 'note' | 'question' | 'answer' | 'comment';

interface UseVoteProps {
    contentType: ContentType;
    contentId: string;
    authorId: string;
    initialUpvotes: number;
    initialDownvotes: number;
    points: { up: number; down: number };
    collectionPath: string; // e.g., 'notes' or 'questions/contentId/answers'
}

export function useVote({
    contentType,
    contentId,
    authorId,
    initialUpvotes,
    initialDownvotes,
    points,
    collectionPath,
}: UseVoteProps) {
    const [user] = useAuthState(auth);
    const { toast } = useToast();

    const [upvotes, setUpvotes] = useState(initialUpvotes);
    const [downvotes, setDownvotes] = useState(initialDownvotes);
    const [userVote, setUserVote] = useState<VoteType | null>(null);

    // Listen for real-time vote updates on the content
    useEffect(() => {
        if (!db) return;
        const contentRef = doc(db, collectionPath, contentId);
        const unsubscribe = onSnapshot(contentRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUpvotes(data.upvotes || 0);
                setDownvotes(data.downvotes || 0);
            }
        });
        return () => unsubscribe();
    }, [collectionPath, contentId]);

    // Listen for real-time updates on the user's vote
    useEffect(() => {
        if (!db || !user) {
            setUserVote(null);
            return;
        }
        const voteId = `${contentType}-${contentId}`;
        const userVoteRef = doc(db, "users", user.uid, "votes", voteId);
        const unsubscribe = onSnapshot(userVoteRef, (docSnap) => {
            setUserVote(docSnap.exists() ? docSnap.data().type : null);
        });
        return () => unsubscribe();
    }, [contentType, contentId, user]);


    const handleVote = async (voteType: VoteType) => {
        if (!user || !db) {
            toast({ variant: "destructive", title: "Login Required" });
            return;
        }
        if (user.uid === authorId) {
            toast({ variant: "destructive", description: `You cannot vote on your own ${contentType}.` });
            return;
        }

        const voteId = `${contentType}-${contentId}`;
        const contentRef = doc(db, collectionPath, contentId);
        const userVoteRef = doc(db, "users", user.uid, "votes", voteId);
        const authorRef = doc(db, "users", authorId);

        try {
            await runTransaction(db, async (transaction) => {
                const userVoteDoc = await transaction.get(userVoteRef);
                const currentVote = userVoteDoc.exists() ? userVoteDoc.data().type : null;

                let upvoteInc = 0;
                let downvoteInc = 0;
                let pointsChange = 0;

                if (currentVote === voteType) { // Undoing vote
                    transaction.delete(userVoteRef);
                    if (voteType === 'up') {
                        upvoteInc = -1;
                        pointsChange = -points.up;
                    } else {
                        downvoteInc = -1;
                        pointsChange = -points.down;
                    }
                } else { // New vote or changing vote
                    transaction.set(userVoteRef, { type: voteType });
                    if (currentVote === 'up') {
                        upvoteInc = -1;
                        pointsChange = -points.up;
                    } else if (currentVote === 'down') {
                        downvoteInc = -1;
                        pointsChange = -points.down;
                    }

                    if (voteType === 'up') {
                        upvoteInc += 1;
                        pointsChange += points.up;
                    } else {
                        downvoteInc += 1;
                        pointsChange += points.down;
                    }
                }
                
                transaction.update(contentRef, {
                    upvotes: increment(upvoteInc),
                    downvotes: increment(downvoteInc)
                });
                
                if (pointsChange !== 0) {
                    transaction.update(authorRef, { points: increment(pointsChange) });
                }
            });
        } catch (error) {
            console.error(`Error ${voteType}-ing ${contentType}:`, error);
            toast({ variant: "destructive", title: "Error", description: "Your vote could not be recorded." });
        }
    };

    return {
        upvotes,
        downvotes,
        userVote,
        handleVote,
    };
}
