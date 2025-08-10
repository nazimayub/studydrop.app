
"use client"

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
    upvotes: number;
    downvotes: number;
    onUpvote: () => void;
    onDownvote: () => void;
    userVote: 'up' | 'down' | null;
}

export function VoteButtons({ upvotes, downvotes, onUpvote, onDownvote, userVote }: VoteButtonsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onUpvote} className={cn(userVote === 'up' && 'text-primary')}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                {upvotes}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDownvote} className={cn(userVote === 'down' && 'text-destructive')}>
                <ThumbsDown className="mr-2 h-4 w-4" />
                {downvotes}
            </Button>
        </div>
    )
}
