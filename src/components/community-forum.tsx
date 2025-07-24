
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MessageSquare } from "lucide-react";
import { useAuth } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getPosts, Post } from '@/lib/forum';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';

interface CommunityForumProps {
    onNewPostClick: () => void;
}

const generateTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 80%)`;
};
const generateTagTextColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 15%)`;
};


export default function CommunityForum({ onNewPostClick }: CommunityForumProps) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch forum posts." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold font-headline">Community Forum</h1>
          <p className="text-muted-foreground">Discuss topics, ask questions, and share your knowledge with the community.</p>
        </div>
        <Button onClick={onNewPostClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Post
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <>
            <Card className="animate-pulse"><CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div><div className="h-4 w-1/4 bg-muted rounded mt-2"></div></CardHeader><CardFooter><div className="h-4 w-1/4 bg-muted rounded"></div></CardFooter></Card>
            <Card className="animate-pulse"><CardHeader><div className="h-6 w-2/3 bg-muted rounded"></div><div className="h-4 w-1/3 bg-muted rounded mt-2"></div></CardHeader><CardFooter><div className="h-4 w-1/4 bg-muted rounded"></div></CardFooter></Card>
          </>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No posts yet. Be the first to start a discussion!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map(post => (
            <Link key={post.id} href={`/forum/${post.id}`} legacyBehavior>
              <a className="block hover:bg-muted/50 rounded-lg transition-colors">
                <Card className="cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.authorPhotoURL || undefined} alt={post.authorName} />
                        <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{post.authorName}</span>
                      <span>&middot;</span>
                      <span>{formatDistanceToNow(post.createdAt.toDate())} ago</span>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex gap-2">
                       {post.tags.map(tag => (
                        <Badge key={tag} style={{ backgroundColor: generateTagColor(tag), color: generateTagTextColor(tag) }}>
                            {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentCount || 0} comments</span>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
