import Link from "next/link";
import { PlusCircle, MessageSquare, Eye, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const forumPosts = [
  {
    id: "1",
    title: "How does the Heinsenberg Uncertainty Principle work in practice?",
    author: "Alice Johnson",
    avatar: "https://placehold.co/40x40.png",
    fallback: "AJ",
    tags: ["physics", "quantum"],
    views: 128,
    replies: 4,
    upvotes: 15,
  },
  {
    id: "2",
    title: "What are the main causes of the fall of the Roman Empire?",
    author: "Bob Williams",
    avatar: "https://placehold.co/40x40.png",
    fallback: "BW",
    tags: ["history", "rome"],
    views: 256,
    replies: 12,
    upvotes: 45,
  },
   {
    id: "3",
    title: "Can someone explain the concept of closures in JavaScript?",
    author: "Charlie Brown",
    avatar: "https://placehold.co/40x40.png",
    fallback: "CB",
    tags: ["programming", "javascript"],
    views: 512,
    replies: 8,
    upvotes: 72,
  },
];

export default function ForumPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Q&amp;A Forum</h1>
            <p className="text-muted-foreground">Ask questions, get answers, and help others.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ask Question
        </Button>
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
                {post.tags.map(tag => (
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
