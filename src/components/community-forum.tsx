
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MessageSquare, ThumbsUp, Trash, Loader2 } from "lucide-react";
import { useAuth } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getPosts, createPost, Post, PostData } from '@/lib/forum';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(20, "Content must be at least 20 characters long."),
  tags: z.string().optional(),
});

export default function CommunityForum() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", content: "", tags: "" },
  });

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

  const handleCreatePost = async (values: z.infer<typeof postSchema>) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a post." });
      return;
    }
    setIsSubmitting(true);
    try {
      const postData: PostData = {
        title: values.title,
        content: values.content,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        authorId: user.uid,
        authorName: user.displayName || user.email || "Anonymous",
        authorPhotoURL: user.photoURL
      };
      await createPost(postData);
      toast({ title: "Success", description: "Your post has been created." });
      setIsCreatePostOpen(false);
      form.reset();
      fetchPosts(); // Refresh posts list
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create post." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold font-headline">Community Forum</h1>
          <p className="text-muted-foreground">Discuss topics, ask questions, and share your knowledge with the community.</p>
        </div>
        <Button onClick={() => setIsCreatePostOpen(true)} disabled={!user}>
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
                      {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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

      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create a new post</DialogTitle>
            <DialogDescription>Share your thoughts with the community. Please be respectful and follow community guidelines.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreatePost)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="Enter a descriptive title" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea {...field} placeholder="What's on your mind?" rows={8} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem><FormLabel>Tags (optional)</FormLabel><FormControl><Input {...field} placeholder="e.g., javascript, react, help" /></FormControl><FormDescription>Separate tags with a comma.</FormDescription><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
