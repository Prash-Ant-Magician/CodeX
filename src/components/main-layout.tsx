
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Code, BookOpen, Trophy, MessageSquare, LogOut, Settings, Mic, Users, PlusCircle, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Logo } from '@/components/logo';
import CodeEditor from '@/components/code-editor';
import LearningModules from '@/components/learning-modules';
import CodingChallenges from '@/components/coding-challenges';
import FeedbackForm from '@/components/feedback-form';
import SettingsPage, { SettingsProvider } from '@/components/settings';
import QaSessions from '@/components/qa-sessions';
import CommunityForum from '@/components/community-forum';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPost, PostData } from '@/lib/forum';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Snippet, saveSnippet, getSnippets, deleteSnippet, saveLocalSnippet, getLocalSnippets, SnippetData } from '@/lib/snippets';


const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(20, "Content must be at least 20 characters long."),
  tags: z.string().optional(),
});


type ActiveView = 'editor' | 'learn' | 'challenges' | 'feedback' | 'settings' | 'qa' | 'forum';
type Language = 'frontend' | 'html' | 'css' | 'javascript' | 'typescript' | 'c' | 'python' | 'java' | 'ruby' | 'r';
type FileType = 'html' | 'css' | 'javascript';


const navItems: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
    { view: 'editor', label: 'Code Editor', icon: <Code className="h-5 w-5" /> },
    { view: 'learn', label: 'Learn', icon: <BookOpen className="h-5 w-5" /> },
    { view: 'challenges', label: 'Challenges', icon: <Trophy className="h-5 w-5" /> },
    { view: 'forum', label: 'Forum', icon: <Users className="h-5 w-5" /> },
    { view: 'qa', label: 'Q&A Sessions', icon: <Mic className="h-5 w-5" /> },
    { view: 'feedback', label: 'Feedback', icon: <MessageSquare className="h-5 w-5" /> },
    { view: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

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

const MainHeader = ({ activeView, setActiveView }: { activeView: ActiveView; setActiveView: (view: ActiveView) => void; }) => {
    const userNav = UserNav();
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container flex h-16 items-center">
                <Logo />
                
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        {navItems.map(item => (
                            <Link
                                key={item.view}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveView(item.view);
                                }}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    activeView === item.view ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="hidden md:block">
                        {userNav}
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="md:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <nav className="flex flex-col gap-4">
                                {navItems.map(item => (
                                    <SheetClose asChild key={item.view}>
                                        <Link
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setActiveView(item.view);
                                            }}
                                            className="flex items-center gap-2 rounded-lg p-3 text-lg font-medium hover:bg-muted"
                                        >
                                            {item.icon} {item.label}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </nav>
                            <div className="mt-6 border-t pt-6">
                                {userNav}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
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
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('frontend');
  const [snippets, setSnippets] = useState<Snippet[]>([]);

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

  const handleCreatePost = async (values: z.infer<typeof postSchema,>) => {
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

  const onCodeChange = useCallback((lang: Language, newCode: string) => {
    setCodes(prev => ({...prev, [lang]: newCode}));
  }, []);

  const onFrontendCodeChange = useCallback((file: FileType, newCode: string) => {
    setCodes(prev => ({
      ...prev,
      frontend: { ...prev.frontend, [file]: newCode }
    }));
  }, []);
  
  const fetchSnippets = useCallback(async () => {
    try {
      if (user) {
        const firestoreSnippets = await getSnippets(user.uid);
        setSnippets(firestoreSnippets);
      } else {
        setSnippets(getLocalSnippets());
      }
    } catch (error) {
      console.error("Failed to fetch snippets:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load your snippets.' });
    }
  }, [user, toast]);
  
  const onSaveSnippet = useCallback(async (name: string, lang: Language) => {
      let codeToSave;
      if (lang === 'frontend') {
        codeToSave = JSON.stringify(codes.frontend);
      } else {
        codeToSave = codes[lang as keyof AllCodes] as string;
      }
      const snippetData: SnippetData = { name, language: lang, code: codeToSave };
      try {
        if (user) {
          await saveSnippet(user.uid, snippetData);
        } else {
          saveLocalSnippet(snippetData);
        }
        toast({ title: 'Success', description: 'Snippet saved successfully.' });
        await fetchSnippets(); // Refresh list
      } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not save snippet.' });
      }
  }, [user, codes, toast, fetchSnippets]);

  const onLoadSnippet = useCallback((snippet: Snippet) => {
    try {
      const lang = snippet.language as Language;
      setSelectedLanguage(lang);
      if (lang === 'frontend') {
        const loadedCodes = JSON.parse(snippet.code);
        if (loadedCodes.html !== undefined && loadedCodes.css !== undefined && loadedCodes.javascript !== undefined) {
          onFrontendCodeChange('html', loadedCodes.html);
          onFrontendCodeChange('css', loadedCodes.css);
          onFrontendCodeChange('javascript', loadedCodes.javascript);
        } else {
          throw new Error("Invalid project format.");
        }
      } else {
        onCodeChange(lang, snippet.code);
      }
      toast({ title: 'Snippet Loaded', description: `"${snippet.name}" has been loaded into the editor.` });
    } catch (e) {
        console.error("Failed to parse snippet:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load snippet. The data might be corrupted.' });
    }
  }, [toast, onCodeChange, onFrontendCodeChange]);
  
  const onDeleteSnippet = useCallback(async (id: string) => {
    try {
        if (user) {
            await deleteSnippet(user.uid, id);
        } else {
            deleteLocalSnippet(id);
        }
        toast({ title: 'Snippet Deleted', description: 'The snippet has been removed.' });
        await fetchSnippets(); // Refresh list
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete snippet.' });
    }
  }, [user, toast, fetchSnippets]);


  const renderContent = () => {
    switch (activeView) {
      case 'editor':
        return <CodeEditor
            codes={codes}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            onFrontendCodeChange={onFrontendCodeChange}
            onCodeChange={onCodeChange}
            onShare={handleOpenCreatePostDialog}
            snippets={snippets}
            fetchSnippets={fetchSnippets}
            onSaveSnippet={onSaveSnippet}
            onLoadSnippet={onLoadSnippet}
            onDeleteSnippet={onDeleteSnippet}
          />;
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
        return <CodeEditor
            codes={codes}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            onFrontendCodeChange={onFrontendCodeChange}
            onCodeChange={onCodeChange}
            onShare={handleOpenCreatePostDialog}
            snippets={snippets}
            fetchSnippets={fetchSnippets}
            onSaveSnippet={onSaveSnippet}
            onLoadSnippet={onLoadSnippet}
            onDeleteSnippet={onDeleteSnippet}
          />;
    }
  };

  return (
    <SettingsProvider>
        <div className="relative flex min-h-screen flex-col">
            <MainHeader activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-1 container p-4 md:p-6">{renderContent()}</main>
        </div>
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
    </SettingsProvider>
  );
}

    