
"use client"

import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { suggestTags } from "@/ai/flows/suggest-tags-flow";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tag {
    class: string;
    topic: string;
}

export default function NewNotePage() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    
    const [existingClasses, setExistingClasses] = useState<string[]>([]);
    const [existingTopics, setExistingTopics] = useState<string[]>([]);

    const [currentClass, setCurrentClass] = useState("");
    const [currentTopic, setCurrentTopic] = useState("");

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [user] = useAuthState(auth);
    const { toast } = useToast();

     useEffect(() => {
        const fetchTags = async () => {
            const notesSnapshot = await getDocs(collection(db, "notes"));
            const classes = new Set<string>();
            const topics = new Set<string>();
            notesSnapshot.forEach(doc => {
                const noteTags = doc.data().tags as Tag[];
                noteTags?.forEach(tag => {
                    classes.add(tag.class);
                    topics.add(tag.topic);
                });
            });
            setExistingClasses(Array.from(classes));
            setExistingTopics(Array.from(topics));
        };
        fetchTags();
    }, []);

    const handleAddTag = () => {
        if (currentClass && currentTopic) {
            const newTag = { class: currentClass, topic: currentTopic };
            if (!tags.some(tag => tag.class === newTag.class && tag.topic === newTag.topic)) {
                setTags([...tags, newTag]);
            }
            setCurrentTopic("");
        }
    };

    const handleRemoveTag = (tagToRemove: Tag) => {
        setTags(tags.filter(tag => !(tag.class === tagToRemove.class && tag.topic === tagToRemove.topic)));
    };

    const handleSuggestTags = async () => {
        if (!content) {
            toast({
                variant: "destructive",
                title: "Content needed",
                description: "Please write some content in your note before suggesting tags.",
            });
            return;
        }
        setIsSuggesting(true);
        try {
            const result = await suggestTags({ noteContent: content });
            if (result.tags) {
                const suggestedTopics = result.tags;
                 if (currentClass) {
                    const newTags = suggestedTopics.map(topic => ({ class: currentClass, topic }));
                    setTags(prevTags => {
                        const uniqueNewTags = newTags.filter(nt => !prevTags.some(pt => pt.class === nt.class && pt.topic === nt.topic));
                        return [...prevTags, ...uniqueNewTags];
                    });
                } else {
                     toast({
                        variant: "destructive",
                        title: "Select a class",
                        description: "Please select a class before suggesting topics.",
                    });
                }
            }
        } catch (error) {
            console.error("Error suggesting tags:", error);
            toast({ variant: "destructive", title: "AI Error", description: "Could not suggest tags." });
        }
        setIsSuggesting(false);
    };

    const handleCreateNote = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (!title || !content) {
             toast({
                variant: "destructive",
                title: "Missing fields",
                description: "Please fill out title and content.",
            });
            return;
        }

        setIsLoading(true);

        try {
            await addDoc(collection(db, "notes"), {
                title,
                content,
                tags,
                date: new Date().toISOString(),
                status: "Published",
                authorId: user.uid,
                authorName: user.displayName || "Anonymous",
                isPublic: true,
            });
            
            toast({
                title: "Note Created!",
                description: "Your new note has been saved.",
            })

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error adding document: ", error.message);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not create the note. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Add New Note</CardTitle>
                    <CardDescription>Fill out the form below to create a new note. All notes are public.</CardDescription>
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
                        <div className="flex items-end gap-2">
                             <div className="grid gap-2 flex-1">
                                <Label htmlFor="class-input" className="text-xs">Class</Label>
                                <Input id="class-input" placeholder="e.g. History 101" value={currentClass} onChange={(e) => setCurrentClass(e.target.value)} />
                            </div>
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="topic-input" className="text-xs">Topic</Label>
                                <Input id="topic-input" placeholder="e.g. World War II" value={currentTopic} onChange={(e) => setCurrentTopic(e.target.value)} />
                            </div>
                            <Button variant="outline" onClick={handleAddTag}>Add Tag</Button>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" placeholder="Write your note here..." rows={10} value={content} onChange={(e) => setContent(e.target.value)} />
                         <Button variant="outline" onClick={handleSuggestTags} disabled={isSuggesting} className="mt-2 self-start">
                            <Sparkles className="mr-2 h-4 w-4"/>
                            {isSuggesting ? 'Suggesting...' : 'Suggest Tags with AI'}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleCreateNote} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Note"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
