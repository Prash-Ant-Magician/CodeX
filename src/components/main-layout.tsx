
"use client";

import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Code, BookOpen, Trophy, MessageSquare, LogOut, Settings, Mic, Users, PlusCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import CodeEditor from '@/components/code-editor';
import LearningModules from '@/components/learning-modules';
import CodingChallenges from '@/components/coding-challenges';
import FeedbackForm from '@/components/feedback-form';
import SettingsPage, { SettingsProvider } from '@/components/settings';
import QaSessions from '@/components/qa-sessions';
import CommunityForum from '@/components/community-forum';
import { Toaster } from './ui/toaster';
import { useAuth, signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPost, PostData } from '@/lib/forum';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(20, "Content must be at least 20 characters long."),
  tags: z.string().optional(),
});


type ActiveView = 'editor' | 'learn' | 'challenges' | 'feedback' | 'settings' | 'qa' | 'forum';

const defaultCodes = {
  frontend: {
    html: `<!DOCTYPE html>
<html>
<head>
  <title>CodeLeap Project</title>
  <!-- style.css is automatically linked -->
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, CodeLeap!</h1>
  <p>This is your HTML file.</p>
  <button onclick="greet()">Click Me</button>

  <!-- script.js is automatically linked -->
  <script src="script.js"></script>
</body>
</html>`,
    css: `body {
  font-family: sans-serif;
  background-color: #1a1a1a;
  color: #f0f0f0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}

h1 {
  color: #3F51B5;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  background-color: #3F51B5;
  color: white;
  border: none;
}`,
    javascript: `function greet() {
  alert("Hello from your JavaScript file!");
}

console.log("Hello, CodeLeap!");`,
  },
  html: `<h1>Hello, World!</h1>
<p>This is a paragraph.</p>`,
  css: `body {
  background-color: #f0f0f0;
  font-family: sans-serif;
}`,
  javascript: `console.log("Hello, World!");`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, C World!\\n");
    return 0;
}`,
  python: `def greet(name):
    print(f"Hello, {name}!")

greet("Python World")`,
  java: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java World!");
    }
}`,
  typescript: `let message: string = "Hello, TypeScript!";
console.log(message);`,
  ruby: `puts "Hello, Ruby!"`,
  r: `print("Hello, R!")`,
};

export type AllCodes = typeof defaultCodes;


function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to sign out." });
    }
  };

  if (!user) {
    return (
       <Button onClick={() => router.push('/login')} variant="outline">
        Login
      </Button>
    );
  }

  const getInitials = (email: string) => {
    const parts = email.split('@');
    return parts[0][0].toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.email ? getInitials(user.email) : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || user.phoneNumber}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarHeaderContent() {
    return (
        <SidebarHeader>
            <Logo />
        </SidebarHeader>
    );
}

function MainHeaderContent() {
  const { isMobile, open, state } = useSidebar();
  return (
     <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
         {isMobile || state === 'collapsed' ? <Logo /> : null}
         {isMobile && state === 'collapsed' && <h1 className="text-xl font-bold text-foreground font-headline">CodeLeap</h1>}
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
          <UserNav />
      </div>
    </header>
  );
}

export function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [codes, setCodes] = useState<AllCodes>(defaultCodes);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [prefilledPostContent, setPrefilledPostContent] = useState("");
  const [forumRefreshKey, setForumRefreshKey] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", content: "", tags: "" },
  });

  const handleOpenCreatePostDialog = (codeToShare?: string, language?: string) => {
    let content = "";
    if (codeToShare) {
        content = `I'm working on this piece of code and have a question.\n\n\`\`\`${language || ''}\n${codeToShare}\n\`\`\`\n\n`;
    }
    setPrefilledPostContent(content);
    form.reset({ title: "", content: content, tags: "" });
    setIsCreatePostOpen(true);
  };

  const handleCreatePost = async (values: z.infer<typeof postSchema>) => {
    setIsSubmitting(true);
    try {
      const postData: PostData = {
        title: values.title,
        content: values.content,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        authorId: user?.uid || 'anonymous',
        authorName: user?.displayName || user?.email || "Anonymous",
        authorPhotoURL: user?.photoURL || null
      };
      await createPost(postData);
      toast({ title: "Success", description: "Your post has been created." });
      setIsCreatePostOpen(false);
      form.reset();
      setForumRefreshKey(prev => prev + 1); // Trigger a refresh
      setActiveView('forum'); // Switch to forum view after posting
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create post." });
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderContent = () => {
    switch (activeView) {
      case 'editor':
        return <CodeEditor codes={codes} setCodes={setCodes} onShare={handleOpenCreatePostDialog} />;
      case 'learn':
        return <LearningModules />;
      case 'challenges':
        return <CodingChallenges />;
      case 'forum':
        return <CommunityForum key={forumRefreshKey} onNewPostClick={() => handleOpenCreatePostDialog()} />;
      case 'qa':
        return <QaSessions />;
      case 'feedback':
        return <FeedbackForm />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CodeEditor codes={codes} setCodes={setCodes} onShare={handleOpenCreatePostDialog} />;
    }
  };

  return (
    <SettingsProvider>
      <SidebarProvider>
        <Sidebar collapsible="offcanvas">
          <SidebarHeaderContent />
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('editor')}
                  isActive={activeView === 'editor'}
                  tooltip="Code Editor"
                  size="lg"
                >
                  <Code />
                  <span>Code Editor</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('learn')}
                  isActive={activeView === 'learn'}
                  tooltip="Learning Modules"
                   size="lg"
                >
                  <BookOpen />
                  <span>Learn</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('challenges')}
                  isActive={activeView === 'challenges'}
                  tooltip="Coding Challenges"
                   size="lg"
                >
                  <Trophy />
                  <span>Challenges</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('forum')}
                  isActive={activeView === 'forum'}
                  tooltip="Community Forum"
                   size="lg"
                >
                  <Users />
                  <span>Forum</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('qa')}
                  isActive={activeView === 'qa'}
                  tooltip="Q&A Sessions"
                   size="lg"
                >
                  <Mic />
                  <span>Q&A Sessions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('feedback')}
                  isActive={activeView === 'feedback'}
                  tooltip="Feedback"
                   size="lg"
                >
                  <MessageSquare />
                  <span>Feedback</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('settings')}
                  isActive={activeView === 'settings'}
                  tooltip="Settings"
                   size="lg"
                >
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <MainHeaderContent />
          <main className="p-4 md:p-6">{renderContent()}</main>
        </SidebarInset>
        <Toaster />

        {/* Global Create Post Dialog */}
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

      </SidebarProvider>
    </SettingsProvider>
  );
}

    