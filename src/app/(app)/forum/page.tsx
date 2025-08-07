
"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, MessageSquare, Eye, ThumbsUp } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ForumPost {
    id: string;
    title: string;
    author: string;
    avatar: string;
    fallback: string;
    tags: string[];
    views: number;
    replies: number;
    upvotes: number;
}

export default function ForumPage() {
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            const postsCollection = collection(db, "questions");
            const postsSnapshot = await getDocs(postsCollection);
            const postsList = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
            setForumPosts(postsList);
        };

        fetchPosts();
    }, []);

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
          <Input placeholder="Search questions..." className="flex-1"/>
          <Button variant="outline">Filter by Tag</Button>
      </div>
      <div className="grid gap-4">
        {forumPosts.map(post => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-start gap-4">
              <Avatar>
                <AvatarImage src={post.avatar} />
                <AvatarFallback>{post.fallback}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <Link href={`/forum/${post.id}`}>
                    <CardTitle className="hover:underline">{post.title}</CardTitle>
                </Link>
                <CardDescription>
                  Asked by {post.author}
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
                {post.upvotes}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.replies} Replies
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views} Views
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
