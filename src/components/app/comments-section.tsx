
"use client"

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, runTransaction, deleteDoc, writeBatch } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useVote } from "@/hooks/use-vote";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { VoteButtons } from "./vote-buttons";
import { MoreHorizontal, Paperclip, File as FileIcon, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

interface CommentProps {
    comment: Comment;
    collectionPath: string;
    onDelete: (commentId: string) => void;
}

function CommentComponent({ comment, collectionPath, onDelete }: CommentProps) {
    const [user] = useAuthState(auth);
    const { upvotes, downvotes, userVote, handleVote } = useVote({
        contentType: 'comment',
        contentId: comment.id,
        authorId: comment.authorId,
        initialUpvotes: comment.upvotes,
        initialDownvotes: comment.downvotes,
        points: { up: 1, down: 0 },
        collectionPath: collectionPath,
    });

    return (
        <Card>
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
                                    <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">Delete</DropdownMenuItem>
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
                    upvotes={upvotes}
                    downvotes={downvotes}
                    onUpvote={() => handleVote('up')}
                    onDownvote={() => handleVote('down')}
                    userVote={userVote}
               />
            </CardFooter>
        </Card>
    )
}

interface CommentsSectionProps {
    contentId: string;
    contentType: 'note' | 'question';
    contentAuthorId: string;
}

export function CommentsSection({ contentId, contentType, contentAuthorId }: CommentsSectionProps) {
    const [user] = auth ? useAuthState(auth) : [null];
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

    const collectionName = contentType === 'note' ? 'notes' : 'questions';
    const commentsCollectionPath = `${collectionName}/${contentId}/comments`;
    const commentsCollectionRef = db ? collection(db, commentsCollectionPath) : null;
    
    useEffect(() => {
        if (!commentsCollectionRef) return;
        const q = query(commentsCollectionRef, orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const commentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsList);
        });
        return () => unsubscribe();
    }, [contentId, user]);
    
    const handleDeleteClick = (commentId: string) => {
        setCommentToDelete(commentId);
        setShowDeleteDialog(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast({ variant: "destructive", title: "File too large", description: `Please select a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
                return;
            }
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                toast({ variant: "destructive", title: "Invalid file type", description: "Please select a PNG, JPG, or PDF file." });
                return;
            }
            setAttachment(file);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!commentToDelete || !commentsCollectionRef) return;
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
        if (!newComment.trim() || !user || !db || !storage || !commentsCollectionRef) return;
        setIsLoading(true);
        const newCommentRef = doc(commentsCollectionRef);
        
        try {
            const uploadPromise = attachment ? (async () => {
                const storageRef = ref(storage, `attachments/comments/${user.uid}/${newCommentRef.id}_${attachment.name}`);
                await uploadBytes(storageRef, attachment);
                return getDownloadURL(storageRef);
            })() : Promise.resolve(null);
            
            const transactionPromise = runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await transaction.get(userDocRef);
                if (!userDocSnap.exists()) throw "User does not exist";

                const userData = userDocSnap.data();
                const authorName = user.displayName || `${userData.firstName} ${userData.lastName}`;
                const authorAvatar = user.photoURL || userData.photoURL || "";
                const authorFallback = (user.displayName?.charAt(0) || userData.firstName?.charAt(0) || '') + (user.displayName?.split(' ')[1]?.charAt(0) || userData.lastName?.charAt(0) || '');

                transaction.update(userDocRef, { points: increment(2) });

                transaction.set(newCommentRef, {
                    authorId: user.uid, authorName, authorAvatar, authorFallback,
                    content: newComment,
                    date: serverTimestamp(),
                    upvotes: 0, downvotes: 0,
                    attachmentURL: "", attachmentName: attachment?.name || "",
                });

                 if (contentAuthorId && contentAuthorId !== user.uid && userData.notificationPreferences?.commentsOnNotes) {
                     const notificationRef = doc(collection(db, 'users', contentAuthorId, 'notifications'));
                     const link = contentType === 'note' ? `/notes/${contentId}` : `/forum/${contentId}`;
                     const contentDoc = await getDoc(doc(db, collectionName, contentId));
                     const title = contentDoc.exists() ? contentDoc.data().title : 'your post';

                     transaction.set(notificationRef, {
                        type: 'new_comment',
                        message: `${authorName} commented on ${title}`,
                        link, isRead: false, date: serverTimestamp(),
                    });
                }
            });
            
            const [attachmentURL] = await Promise.all([uploadPromise, transactionPromise]);

            if (attachmentURL) {
                await updateDoc(newCommentRef, { attachmentURL });
            }

            setNewComment("");
            setAttachment(null);
        } catch (error) {
            console.error("Error adding comment: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not post your comment." });
        } finally {
            setIsLoading(false);
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
                        <Input id="attachment-comment" type="file" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} />
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
                    <CommentComponent
                        key={comment.id}
                        comment={comment}
                        collectionPath={commentsCollectionPath}
                        onDelete={handleDeleteClick}
                    />
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
