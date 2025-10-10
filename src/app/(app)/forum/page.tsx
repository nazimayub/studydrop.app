
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface ForumPostTag {
    class: string;
    topic: string;
}

interface ForumPost {
    id: string;
    title: string;
    author: string;
    authorId: string;
    avatar: string;
    fallback: string;
    tags: ForumPostTag[];
    views: number;
    replies: number;
    upvotes: number;
    downvotes: number;
    date: any;
}

export default function ForumPage() {
    const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    
    const [selectedClass, setSelectedClass] = useState("");
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState("");
    const [activeFilters, setActiveFilters] = useState<ForumPostTag[]>([]);


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
                activeFilters.every(filter => 
                    post.tags?.some(tag => tag.class === filter.class && tag.topic === filter.topic)
                )
            );
        }

        posts.sort((a, b) => {
            if (sortOrder === "newest") {
                return (b.date?.seconds || 0) - (a.date?.seconds || 0);
            }
            if (sortOrder === "popular") {
                const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
                const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
                return scoreB - scoreA;
            }
            return 0;
        });

        setFilteredPosts([...posts]);
    }, [searchTerm, activeFilters, allPosts, sortOrder]);
    
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
            const newFilter = { class: selectedClass, topic: selectedUnit };
            if (!activeFilters.some(f => f.class === newFilter.class && f.topic === newFilter.topic)) {
                setActiveFilters([...activeFilters, newFilter]);
            }
            setSelectedUnit("");
        }
    };

    const handleRemoveFilter = (filterToRemove: ForumPostTag) => {
        setActiveFilters(activeFilters.filter(f => !(f.class === filterToRemove.class && f.topic === filterToRemove.topic)));
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
      <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Input placeholder="Search by question title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                 <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by AP Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {apCourses.map(course => (
                                <SelectItem key={course.name} value={course.name}>{course.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableUnits.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddFilter} disabled={!selectedUnit}>Add Filter</Button>
                </div>
          </CardHeader>
            {activeFilters.length > 0 && (
                <CardContent className="border-t pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Active filters:</span>
                        {activeFilters.map(filter => (
                            <Badge key={`${filter.class}-${filter.topic}`} variant="secondary">
                                {filter.class}: {filter.topic}
                                <button className="ml-1" onClick={() => handleRemoveFilter(filter)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}>Clear all</Button>
                    </div>
                </CardContent>
            )}
            <CardContent className="p-0">
                <div className="grid">
                    {filteredPosts.map(post => (
                    <div key={post.id} className="flex items-start gap-4 p-4 border-b last:border-b-0">
                        <UserLink authorId={post.authorId}>
                            <Avatar>
                                <AvatarImage src={post.avatar} />
                                <AvatarFallback>{post.fallback}</AvatarFallback>
                            </Avatar>
                        </UserLink>
                        <div className="grid gap-1 flex-1">
                            <Link href={`/forum/${post.id}`} className="hover:underline">
                                <h3 className="font-semibold">{post.title}</h3>
                            </Link>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {post.tags && post.tags.map(tag => (
                                <Badge key={`${tag.class}-${tag.topic}`} variant="secondary">{tag.class}: {tag.topic}</Badge>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Asked by <UserLink authorId={post.authorId}>{post.author}</UserLink> on {new Date(post.date?.seconds * 1000).toLocaleDateString()}
                            </p>
                        </div>
                         <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                {(post.upvotes || 0) - (post.downvotes || 0)}
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.replies || 0}
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.views || 0}
                            </div>
                        </div>
                    </div>
                    ))}
                    {filteredPosts.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground">
                            No questions found matching your criteria.
                        </div>
                    )}
                </div>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredPosts.length}</strong> of <strong>{allPosts.length}</strong> questions.
                </div>
            </CardFooter>
      </Card>
      
    </div>
  )
}

    