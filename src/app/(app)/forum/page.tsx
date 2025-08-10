
"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, MessageSquare, Eye, ThumbsUp, X } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { apCourses } from "@/lib/ap-courses";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


interface ForumPost {
    id: string;
    title: string;
    author: string;
    authorId: string;
    avatar: string;
    fallback: string;
    tags: string[];
    views: number;
    replies: number;
    upvotes: number;
    date: any;
}

export default function ForumPage() {
    const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState("");
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState("");
    const [activeFilters, setActiveFilters] = useState<string[]>([]);


    useEffect(() => {
        const fetchPosts = async () => {
            const postsCollection = collection(db, "questions");
            const q = query(postsCollection, orderBy("date", "desc"));
            const postsSnapshot = await getDocs(q);
            const postsList = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
            setAllPosts(postsList);
        };

        fetchPosts();
    }, []);

    useEffect(() => {
        let posts = allPosts;
        if (searchTerm) {
            posts = posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (activeFilters.length > 0) {
            posts = posts.filter(post => 
                activeFilters.every(filter => post.tags.some(tag => tag === filter || tag.startsWith(`${filter}:`)))
            );
        }
        setFilteredPosts(posts);
    }, [searchTerm, activeFilters, allPosts]);
    
     useEffect(() => {
        if (selectedClass) {
            const course = apCourses.find(c => c.name === selectedClass);
            setAvailableUnits(course ? course.units : []);
            setSelectedUnit("");
        } else {
            setAvailableUnits([]);
        }
    }, [selectedClass]);
    
    const handleAddFilter = () => {
        if (selectedClass && selectedUnit) {
            const newFilter = `${selectedClass}: ${selectedUnit}`;
            if (!activeFilters.includes(newFilter)) {
                setActiveFilters([...activeFilters, newFilter]);
            }
        } else if (selectedClass) {
             if (!activeFilters.includes(selectedClass)) {
                setActiveFilters([...activeFilters, selectedClass]);
            }
        }
        setSelectedClass("");
        setSelectedUnit("");
        setIsFilterDialogOpen(false);
    };

    const handleRemoveFilter = (filterToRemove: string) => {
        setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
    };
    
    const UserLink = ({ authorId, children }: { authorId?: string, children: React.ReactNode }) => {
        return authorId ? <Link href={`/users/${authorId}`} className="hover:underline">{children}</Link> : <>{children}</>;
    };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Q&A Forum</h1>
            <p className="text-muted-foreground">Ask questions, get answers, and help others.</p>
        </div>
        <Link href="/forum/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ask Question
          </Button>
        </Link>
      </div>
      <div className="flex items-center gap-4">
          <Input placeholder="Search questions..." className="flex-1" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Filter by Tag</Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Filter by AP Class & Unit</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                     <div className="grid gap-2 flex-1">
                        <Label htmlFor="class-select" className="text-xs">AP Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger id="class-select">
                                <SelectValue placeholder="Select an AP Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {apCourses.map(course => (
                                    <SelectItem key={course.name} value={course.name}>{course.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2 flex-1">
                        <Label htmlFor="unit-select" className="text-xs">Unit / Topic (Optional)</Label>
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
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddFilter} disabled={!selectedClass}>Add Filter</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </div>
       {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active filters:</span>
              {activeFilters.map(tag => (
                  <Badge key={tag} variant="secondary">
                      {tag}
                      <button className="ml-1" onClick={() => handleRemoveFilter(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                  </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}>Clear all</Button>
          </div>
        )}
      <div className="grid gap-4">
        {filteredPosts.map(post => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-start gap-4">
               <UserLink authorId={post.authorId}>
                  <Avatar>
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback>{post.fallback}</AvatarFallback>
                  </Avatar>
               </UserLink>
              <div className="grid gap-1">
                <Link href={`/forum/${post.id}`}>
                    <CardTitle className="hover:underline">{post.title}</CardTitle>
                </Link>
                <CardDescription>
                  Asked by <UserLink authorId={post.authorId}>{post.author}</UserLink> on {new Date(post.date?.seconds * 1000).toLocaleDateString()}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {post.tags && post.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {post.upvotes || 0}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.replies || 0} Replies
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views || 0} Views
              </div>
            </CardFooter>
          </Card>
        ))}
         {filteredPosts.length === 0 && (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No questions found matching your criteria.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
