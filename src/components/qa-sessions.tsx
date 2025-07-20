
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Video, PlusCircle, Edit, Trash2, Loader2, Link } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/auth";
import { getSessions, addSession, updateSession, deleteSession, Session } from "@/lib/sessions";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ADMIN_UID = "FrX4x0sz57TFVUVZHT90oH6dS293";

const sessionSchema = z.object({
  topic: z.string().min(1, "Topic is required."),
  expert: z.string().min(1, "Expert name is required."),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  description: z.string().min(1, "Description is required."),
  avatarHint: z.string().min(1, "Avatar hint is required (e.g., 'man scientist')."),
  sessionUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

export default function QaSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const isAdmin = user?.uid === ADMIN_UID;

  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      topic: "",
      expert: "",
      date: "",
      time: "",
      description: "",
      avatarHint: "",
      sessionUrl: "",
    },
  });

  const fetchAndSetSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSessions = await getSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load Q&A sessions." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAndSetSessions();
  }, [fetchAndSetSessions]);

  useEffect(() => {
    if (isDialogOpen && editingSession) {
      form.reset({
        ...editingSession,
        sessionUrl: editingSession.sessionUrl || "",
      });
    } else {
      form.reset({
        topic: "",
        expert: "",
        date: "",
        time: "",
        description: "",
        avatarHint: "",
        sessionUrl: "",
      });
    }
  }, [isDialogOpen, editingSession, form]);
  
  const handleEditClick = (session: Session) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };
  
  const handleAddNewClick = () => {
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast({ title: "Success", description: "Session deleted successfully." });
      fetchAndSetSessions();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete session." });
    }
  };

  const onSubmit = async (values: z.infer<typeof sessionSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingSession) {
        await updateSession(editingSession.id, values);
        toast({ title: "Success", description: "Session updated successfully." });
      } else {
        await addSession(values);
        toast({ title: "Success", description: "Session added successfully." });
      }
      fetchAndSetSessions();
      setIsDialogOpen(false);
      setEditingSession(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save session." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold font-headline">Expert Q&amp;A Sessions</h1>
          <p className="text-muted-foreground">Join live sessions with industry experts to get your questions answered.</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Session
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="flex flex-col animate-pulse">
                    <CardHeader><div className="h-8 w-3/4 bg-muted rounded"></div><div className="h-4 w-1/2 bg-muted rounded mt-2"></div></CardHeader>
                    <CardContent className="flex-grow space-y-2"><div className="h-4 w-full bg-muted rounded"></div><div className="h-4 w-5/6 bg-muted rounded"></div></CardContent>
                    <CardFooter><div className="h-10 w-full bg-muted rounded-md"></div></CardFooter>
                </Card>
            ))}
        </div>
      ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">No upcoming Q&A sessions. Please check back later.</p>
            </CardContent>
          </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                     <Image 
                       src={`https://placehold.co/100x100.png`} 
                       alt={session.expert} 
                       width={100} 
                       height={100}
                       data-ai-hint={session.avatarHint}
                     />
                    <AvatarFallback>{session.expert.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{session.topic}</CardTitle>
                    <CardDescription>with {session.expert}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{session.description}</p>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{session.time}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!session.sessionUrl}>
                  <a href={session.sessionUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 h-4 w-4" />
                    Join Session
                  </a>
                </Button>
                {isAdmin && (
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(session)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the session for "{session.topic}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(session.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit Session" : "Add New Session"}</DialogTitle>
            <DialogDescription>
              {editingSession ? "Update the details for this session." : "Fill in the details for the new session."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="topic" render={({ field }) => (
                <FormItem><FormLabel>Topic</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="expert" render={({ field }) => (
                <FormItem><FormLabel>Expert</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="avatarHint" render={({ field }) => (
                <FormItem><FormLabel>Avatar Hint</FormLabel><FormControl><Input placeholder="e.g., 'man developer'" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="sessionUrl" render={({ field }) => (
                <FormItem><FormLabel>Session URL</FormLabel><FormControl><Input placeholder="https://youtube.com/live/..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSession ? "Save Changes" : "Create Session"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    