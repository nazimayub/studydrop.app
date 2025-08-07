
"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, MessageSquare, Eye, ThumbsUp, X } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
    const [allTags, setAllTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

    useEffect(() => {
        const fetchPostsAndTags = async () => {
            const postsCollection = collection(db, "questions");
            const q = query(postsCollection, orderBy("date", "desc"));
            const postsSnapshot = await getDocs(q);
            const postsList = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
            setAllPosts(postsList);

            const tagsSet = new Set<string>();
            postsList.forEach(post => {
                post.tags?.forEach(tag => tagsSet.add(tag));
            });
            setAllTags(Array.from(tagsSet).sort());
        };

        fetchPostsAndTags();
    }, []);

    useEffect(() => {
        let posts = allPosts;
        if (searchTerm) {
            posts = posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedTags.length > 0) {
            posts = posts.filter(post => selectedTags.every(tag => post.tags.includes(tag)));
        }
        setFilteredPosts(posts);
    }, [searchTerm, selectedTags, allPosts]);

    const handleTagSelectionChange = (tag: string, checked: boolean | 'indeterminate') => {
        if (checked) {
            setSelectedTags(prev => [...prev, tag]);
        } else {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        }
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
                      <DialogTitle>Filter by Tags</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                      {allTags.map(tag => (
                          <div key={tag} className="flex items-center space-x-2">
                              <Checkbox 
                                  id={`tag-${tag}`} 
                                  checked={selectedTags.includes(tag)}
                                  onCheckedChange={(checked) => handleTagSelectionChange(tag, checked)}
                              />
                              <Label htmlFor={`tag-${tag}`}>{tag}</Label>
                          </div>
                      ))}
                  </div>
                  <Button onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
              </DialogContent>
          </Dialog>
      </div>
       {selectedTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active filters:</span>
              {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary">
                      {tag}
                      <button className="ml-1" onClick={() => handleTagSelectionChange(tag, false)}>
                        <X className="h-3 w-3" />
                      </button>
                  </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])}>Clear all</Button>
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
              <div className="flex space-x-2">
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
      </div>
    </div>
  )
}
