
"use client"

import { useState, useEffect, ChangeEvent } from "react";
import { collection, addDoc, doc, runTransaction, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { db, auth, storage } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { courses } from "@/lib/courses";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, File as FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface Tag {
    class: string;
    topic: string;
}

export default function NewNotePage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    const [attachment, setAttachment] = useState<File | null>(null);
    
    const [selectedClass, setSelectedClass] = useState("");
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [user] = useAuthState(auth);
    const { toast } = useToast();

    useEffect(() => {
        if (selectedClass) {
            const course = courses.find(c => c.name === selectedClass);
            setAvailableUnits(course ? course.units : []);
            setSelectedUnit("");
        } else {
            setAvailableUnits([]);
        }
    }, [selectedClass]);

    const handleAddTag = () => {
        if (selectedClass && selectedUnit) {
            const newTag = { class: selectedClass, topic: selectedUnit };
            if (!tags.some(tag => tag.class === newTag.class && tag.topic === newTag.topic)) {
                setTags([...tags, newTag]);
            }
            setSelectedUnit("");
        }
    };

    const handleRemoveTag = (tagToRemove: Tag) => {
        setTags(tags.filter(tag => !(tag.class === tagToRemove.class && tag.topic === tagToRemove.topic)));
    };
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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

    const handleCreateNote = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (!title || !content) {
             toast({ variant: "destructive", title: "Missing fields", description: "Please fill out title and content." });
             return;
        }

        if (!db || !storage) return;

        setIsLoading(true);
        const newNoteRef = doc(collection(db, "notes"));

        try {
            const uploadPromise = attachment ? (async () => {
                const storageRef = ref(storage, `attachments/notes/${user.uid}/${newNoteRef.id}_${attachment.name}`);
                await uploadBytes(storageRef, attachment);
                return await getDownloadURL(storageRef);
            })() : Promise.resolve(null);
            
            const transactionPromise = runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw "User does not exist!";
                
                transaction.update(userDocRef, { points: (userDoc.data().points || 0) + 10 });

                transaction.set(newNoteRef, {
                    title,
                    content,
                    tags,
                    date: new Date().toISOString(),
                    authorId: user.uid,
                    authorName: user.displayName || "Anonymous",
                    isPublic: true,
                    upvotes: 0,
                    downvotes: 0,
                    attachmentURL: "", // Placeholder
                    attachmentName: attachment?.name || "",
                });
            });

            const [attachmentURL] = await Promise.all([uploadPromise, transactionPromise]);
            
            if (attachmentURL) {
                await updateDoc(newNoteRef, { attachmentURL });
            }
            
            toast({ title: "Note Created!", description: "Your new note has been saved." });
            router.push("/dashboard");

        } catch (error: any) {
            console.error("Error creating note: ", error.message);
             toast({ variant: "destructive", title: "Error", description: "Could not create the note." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Add New Note</CardTitle>
                    <CardDescription>Fill out the form below to create a new note. You'll earn 10 points for creating a public note!</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="grid gap-4">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <Badge key={`${tag.class}-${tag.topic}`} variant="secondary">
                                    {tag.class}: {tag.topic}
                                    <button className="ml-1" onClick={() => handleRemoveTag(tag)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row items-end gap-2">
                             <div className="grid gap-2 flex-1 w-full">
                                <Label htmlFor="class-select" className="text-xs">Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger id="class-select">
                                        <SelectValue placeholder="Select a Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(course => (
                                            <SelectItem key={course.name} value={course.name}>{course.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2 flex-1 w-full">
                                <Label htmlFor="unit-select" className="text-xs">Unit / Topic</Label>
                                 <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedClass}>
                                    <SelectTrigger id="unit-select">
                                        <SelectValue placeholder="Select a Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUnits.map(unit => (
                                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={handleAddTag} className="w-full sm:w-auto">Add Tag</Button>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" placeholder="Write your note here..." rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="attachment">Attachment (PNG, JPG, PDF up to 5MB)</Label>
                        <Input id="attachment" type="file" onChange={handleFileChange} accept={ALLOWED_FILE_TYPES.join(',')} />
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
                <CardFooter className="flex justify-end">
                    <Button onClick={handleCreateNote} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Note"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
