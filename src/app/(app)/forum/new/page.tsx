
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { courses } from "@/lib/courses";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, File as FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tag {
    class: string;
    topic: string;
}

export default function NewQuestionPage() {
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    const [description, setDescription] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [user] = auth ? useAuthState(auth) : [null];
    const { toast } = useToast();
    
    const [selectedClass, setSelectedClass] = useState("");
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState("");

     useEffect(() => {
        if (selectedClass) {
            const course = courses.find(c => c.name === selectedClass);
            setAvailableUnits(course ? course.units : []);
            setSelectedUnit(""); // Reset unit when class changes
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
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };


    const handlePostQuestion = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (!title || !description) {
             toast({
                variant: "destructive",
                title: "Missing fields",
                description: "Please fill out title and description.",
            });
            return;
        }

        if (!db || !storage) return;

        setIsLoading(true);

        try {
            await runTransaction(db, async (transaction) => {
                let authorName = "Anonymous";
                let authorFallback = "A";
                let authorAvatar = "";

                if (!isAnonymous) {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await transaction.get(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        authorName = `${userData.firstName} ${userData.lastName}`;
                        authorFallback = `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`;
                        authorAvatar = userData.photoURL || "";

                        const newPoints = (userData.points || 0) + 5;
                        transaction.update(userDocRef, { points: newPoints });
                    }
                }
                
                let attachmentURL = "";
                let attachmentName = "";
                if (attachment) {
                    const storageRef = ref(storage, `attachments/questions/${user.uid}/${Date.now()}_${attachment.name}`);
                    await uploadBytes(storageRef, attachment); // This should be outside the transaction
                    attachmentURL = await getDownloadURL(storageRef);
                    attachmentName = attachment.name;
                }

                const newQuestionRef = doc(collection(db, "questions"));
                transaction.set(newQuestionRef, {
                    title,
                    tags,
                    content: description,
                    authorId: isAnonymous ? null : user.uid,
                    author: authorName,
                    avatar: authorAvatar,
                    fallback: authorFallback,
                    date: serverTimestamp(),
                    views: 0,
                    replies: 0,
                    upvotes: 0,
                    downvotes: 0,
                    attachmentURL,
                    attachmentName,
                });
            });

            router.push("/forum");
        } catch (error) {
            console.error("Error adding document: ", error);
             toast({ variant: "destructive", title: "Error", description: "Could not post your question." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Ask a New Question</CardTitle>
                    <CardDescription>Fill out the form below to post your question. You'll get 5 points for asking!</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Question / Title</Label>
                        <Input id="title" placeholder="What is your question?" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Add more details about your question..." rows={10} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="attachment">Attachment</Label>
                        <Input id="attachment" type="file" onChange={handleFileChange} />
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
                    <div className="flex items-center space-x-2">
                        <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(e) => setIsAnonymous(e === true)} />
                        <Label htmlFor="anonymous">Post anonymously</Label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handlePostQuestion} disabled={isLoading}>
                       {isLoading ? "Posting..." : "Post Question"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
