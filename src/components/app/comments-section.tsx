
"use client"

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, runTransaction, deleteDoc, collectionGroup, writeBatch } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { VoteButtons } from "./vote-buttons";
import { MoreHorizontal, Paperclip, File as FileIcon, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorFallback: string;
    content: string;
    date: any;
    upvotes: number;
    downvotes: number;
    attachmentURL?: string;
    attachmentName?: string;
}

interface UserVoteState {
    [commentId: string]: 'up' | 'down' | null;
}

interface CommentsSectionProps {
    contentId: string;
    contentType: 'note' | 'question';
    contentAuthorId: string;
}

export function CommentsSection({ contentId, contentType, contentAuthorId }: CommentsSectionProps) {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [userVotes, setUserVotes] = useState<UserVoteState>({});
    const [newComment, setNewComment] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

    const collectionName = contentType === 'note' ? 'notes' : 'questions';
    const commentsCollectionRef = collection(db, collectionName, contentId, "comments");
    
     const fetchCommentsAndVotes = () => {
        const q = query(commentsCollectionRef, orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const commentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsList);
            
            if (user) {
                const newVotes: UserVoteState = {};
                for (const comment of commentsList) {
                    const voteDocRef = doc(db, "users", user.uid, "votes", `comment-${comment.id}`);
                    const voteDoc = await getDoc(voteDocRef);
                    if (voteDoc.exists()) {
                        newVotes[comment.id] = voteDoc.data().type;
                    } else {
                        newVotes[comment.id] = null;
                    }
                }
                setUserVotes(newVotes);
            }
        });
        return unsubscribe;
    };


    useEffect(() => {
        if (contentId && user) {
            const unsubscribe = fetchCommentsAndVotes();
            return () => unsubscribe();
        }
    }, [contentId, collectionName, user]);
    
    const handleDeleteClick = (commentId: string) => {
        setCommentToDelete(commentId);
        setShowDeleteDialog(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!commentToDelete) return;
        try {
            await deleteDoc(doc(commentsCollectionRef, commentToDelete));
            toast({ title: "Comment deleted." });
        } catch (error) {
            console.error("Error deleting comment: ", error);
            toast({ variant: "destructive", title: "Error deleting comment." });
        } finally {
            setCommentToDelete(null);
            setShowDeleteDialog(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || !user) return;
        setIsLoading(true);
        
        const batch = writeBatch(db);
        
        try {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            const authorName = user.displayName || `${userDocSnap.data()?.firstName} ${userDocSnap.data()?.lastName}`;
            const authorAvatar = user.photoURL || userDocSnap.data()?.photoURL || "";
            const authorFallback = (user.displayName?.charAt(0) || userDocSnap.data()?.firstName?.charAt(0) || '') + (user.displayName?.split(' ')[1]?.charAt(0) || userDocSnap.data()?.lastName?.charAt(0) || '');

            let attachmentURL = "";
            let attachmentName = "";
            if (attachment) {
                const storageRef = ref(storage, `attachments/comments/${user.uid}/${Date.now()}_${attachment.name}`);
                await uploadBytes(storageRef, attachment);
                attachmentURL = await getDownloadURL(storageRef);
                attachmentName = attachment.name;
            }

            const newCommentRef = doc(collection(db, collectionName, contentId, "comments"));
            batch.set(newCommentRef, {
                authorId: user.uid,
                authorName,
                authorAvatar,
                authorFallback,
                content: newComment,
                date: serverTimestamp(),
                upvotes: 0,
                downvotes: 0,
                attachmentURL,
                attachmentName,
            });

            const userPointsRef = doc(db, "users", user.uid);
            batch.update(userPointsRef, { points: increment(10) });

            if (contentAuthorId && contentAuthorId !== user.uid) {
                const contentAuthorDoc = await getDoc(doc(db, 'users', contentAuthorId));
                if (contentAuthorDoc.exists() && contentAuthorDoc.data().notificationPreferences?.commentsOnNotes) {
                     const notificationRef = doc(collection(db, 'users', contentAuthorId, 'notifications'));
                     let link = contentType === 'note' ? `/notes/${contentId}` : `/forum/${contentId}`;
                     const contentDoc = await getDoc(doc(db, collectionName, contentId));
                     const title = contentDoc.exists() ? contentDoc.data().title : 'your post';

                     batch.set(notificationRef, {
                        type: 'new_comment',
                        message: `${authorName} commented on ${title}`,
                        link: link,
                        isRead: false,
                        date: serverTimestamp(),
                    });
                }
            }

            await batch.commit();
            setNewComment("");
            setAttachment(null);

        } catch (error) {
            console.error("Error adding comment: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not post your comment." });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVote = async (commentId: string, voteType: 'up' | 'down', authorId: string) => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required" });
            return;
        }
        if (user.uid === authorId) {
            toast({ variant: "destructive", description: "You cannot vote on your own comment." });
            return;
        }

        const commentRef = doc(commentsCollectionRef, commentId);
        const userVoteRef = doc(db, "users", user.uid, "votes", `comment-${commentId}`);
        const authorRef = doc(db, "users", authorId);

        try {
            await runTransaction(db, async (transaction) => {
                const userVoteDoc = await transaction.get(userVoteRef);
                const commentDoc = await transaction.get(commentRef);

                if (!commentDoc.exists()) {
                    throw "Comment does not exist!";
                }

                const currentVote = userVoteDoc.exists() ? userVoteDoc.data().type : null;
                let commentUpdate: any = {};
                let pointsChange = 0;

                if (currentVote === voteType) {
                    // Undoing vote
                    transaction.delete(userVoteRef);
                    if (voteType === 'up') {
                        commentUpdate.upvotes = increment(-1);
                        pointsChange = -2;
                    } else {
                        commentUpdate.downvotes = increment(-1);
                    }
                } else {
                    // New vote or changing vote
                    transaction.set(userVoteRef, { type: voteType });
                    if (currentVote === 'up') {
                        commentUpdate.upvotes = increment(-1);
                        pointsChange = -2;
                    } else if (currentVote === 'down') {
                        commentUpdate.downvotes = increment(-1);
                    }

                    if (voteType === 'up') {
                        commentUpdate.upvotes = increment(1);
                        pointsChange += 2;
                    } else {
                        commentUpdate.downvotes = increment(1);
                    }
                }
                
                transaction.update(commentRef, commentUpdate);
                if (pointsChange !== 0 && authorId) {
                    transaction.update(authorRef, { points: increment(pointsChange) });
                }
            });
        } catch (error) {
            console.error(`Error ${voteType}ing comment:`, error);
            toast({ variant: "destructive", title: "Error", description: "Your vote could not be recorded." });
        }
    };

    return (
        <div className="grid gap-6">
            <h2 className="text-2xl font-bold font-headline">{comments.length} Comments</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Leave a Comment</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Textarea
                        placeholder="Share your thoughts..."
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!user || isLoading}
                    />
                    <div>
                        <Input id="attachment-comment" type="file" onChange={handleFileChange} />
                         {attachment && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                                <FileIcon className="h-4 w-4" />
                                <span>{attachment.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setAttachment(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePostComment} disabled={!user || isLoading || (!newComment.trim() && !attachment)}>
                        {isLoading ? "Posting..." : "Post Comment"}
                    </Button>
                </CardFooter>
            </Card>

            <div className="grid gap-4">
                {comments.map(comment => (
                    <Card key={comment.id}>
                        <CardHeader className="flex flex-row items-start gap-4 pb-4">
                             <Link href={`/users/${comment.authorId}`}>
                                <Avatar>
                                    <AvatarImage src={comment.authorAvatar} />
                                    <AvatarFallback>{comment.authorFallback}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Link href={`/users/${comment.authorId}`} className="font-semibold hover:underline">{comment.authorName}</Link>
                                        <span className="text-muted-foreground">&middot; {comment.date && new Date(comment.date.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                     {user?.uid === comment.authorId && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleDeleteClick(comment.id)} className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                                <p className="mt-2 text-sm">{comment.content}</p>
                                {comment.attachmentURL && (
                                    <div className="mt-2">
                                        <a href={comment.attachmentURL} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <Paperclip className="mr-2 h-4 w-4" />
                                                {comment.attachmentName || 'View Attachment'}
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardFooter className="flex justify-end pt-0">
                           <VoteButtons
                                upvotes={comment.upvotes}
                                downvotes={comment.downvotes}
                                onUpvote={() => handleVote(comment.id, 'up', comment.authorId)}
                                onDownvote={() => handleVote(comment.id, 'down', comment.authorId)}
                                userVote={userVotes[comment.id]}
                           />
                        </CardFooter>
                    </Card>
                ))}
            </div>
             <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this comment.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
