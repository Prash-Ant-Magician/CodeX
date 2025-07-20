
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";
import { useAuth } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getPost, getComments, createComment, deletePost, deleteComment, Post, Comment, CommentData } from '@/lib/forum';
import { formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormMessage } from '@/components/ui/form';

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty."),
});

export default function PostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  const fetchPostAndComments = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const [fetchedPost, fetchedComments] = await Promise.all([
        getPost(postId),
        getComments(postId)
      ]);
      setPost(fetchedPost);
      setComments(fetchedComments);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load the post." });
    } finally {
      setIsLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const handleCreateComment = async (values: z.infer<typeof commentSchema>) => {
    setIsSubmitting(true);
    try {
      const commentData: CommentData = {
        content: values.content,
        authorId: user?.uid || 'anonymous',
        authorName: user?.displayName || user?.email || "Anonymous",
        authorPhotoURL: user?.photoURL || null
      };
      await createComment(postId, commentData);
      form.reset();
      fetchPostAndComments(); // Refresh comments
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to post comment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post || user.uid !== post.authorId) return;
    try {
      await deletePost(post.id);
      toast({ title: "Success", description: "Post deleted." });
      router.back(); // Or redirect to forum home
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
        await deleteComment(postId, commentId);
        toast({ title: "Success", description: "Comment deleted."});
        fetchPostAndComments(); // Refresh
    } catch(error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete comment." });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!post) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Post not found</h2>
            <p className="text-muted-foreground">The post you are looking for does not exist or has been deleted.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Button onClick={() => router.back()} variant="ghost" className="self-start">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forum
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={post.authorPhotoURL || undefined} alt={post.authorName} />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{post.authorName}</span>
                <span>&middot;</span>
                <span>{formatDistanceToNow(post.createdAt.toDate())} ago</span>
            </div>
            {user?.uid === post.authorId && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your post and all its comments.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeletePost}>Delete Post</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {post.content}
          </div>
        </CardContent>
        <CardFooter>
            <div className="flex gap-2">
                {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold">Comments ({comments.length})</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateComment)} className="flex gap-2 items-start">
              <Avatar className="h-10 w-10 mt-1">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                  <Textarea {...form.register("content")} placeholder="Add your comment..." className="w-full" />
                  <FormMessage>{form.formState.errors.content?.message}</FormMessage>
              </div>
            <Button type="submit" disabled={isSubmitting} size="icon">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex flex-col gap-4">
        {comments.map(comment => (
            <Card key={comment.id} className="bg-muted/50">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.authorPhotoURL || undefined} alt={comment.authorName} />
                                <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{comment.authorName}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt.toDate())} ago</p>
                            </div>
                        </div>
                         {user?.uid === comment.authorId && (
                           <AlertDialog>
                               <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete this comment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                           </AlertDialog>
                        )}
                    </div>
                    <p className="mt-4 text-sm whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
