
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveSnippet, getSnippets, deleteSnippet, saveLocalSnippet, getLocalSnippets, deleteLocalSnippet, Snippet, SnippetData } from '@/lib/snippets';
import { useAuth } from '@/lib/firebase/auth';
import { debugCode } from '@/ai/flows/debug-code';
import { Play, Bug, Save, FolderOpen, Loader2, Trash2, Download, Upload, MoreHorizontal, HelpCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultCode = {
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
</html>
`,
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
}
`,
  javascript: `function greet() {
  alert("Hello from your JavaScript file!");
}

console.log("Hello, CodeLeap!");
`,
};

type FileType = 'html' | 'css' | 'javascript';

export default function CodeEditor() {
  const [codes, setCodes] = useState(defaultCode);
  const [activeTab, setActiveTab] = useState<FileType>('html');
  const [previewDoc, setPreviewDoc] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState('');
  const [isDebugAlertOpen, setIsDebugAlertOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetName, setSnippetName] = useState('');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();


  const updatePreview = useCallback(() => {
    const combinedDoc = `
      <html>
        <head>
          <style>${codes.css}</style>
        </head>
        <body>
          ${codes.html}
          <script>${codes.javascript}</script>
        </body>
      </html>
    `;
    const timeout = setTimeout(() => {
        setPreviewDoc(combinedDoc);
    }, 500);
    return () => clearTimeout(timeout);
  }, [codes]);


  const fetchSnippets = useCallback(async () => {
    setIsActionLoading(true);
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
    } finally {
      setIsActionLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);
  
  useEffect(() => {
    const cleanup = updatePreview();
    return cleanup;
  }, [codes, updatePreview]);

  const handleCodeChange = (language: FileType, value: string) => {
    setCodes(prev => ({ ...prev, [language]: value }));
  };

  const handleRun = () => {
    updatePreview();
    toast({ title: 'Code Executed', description: 'Preview has been updated.' });
  };

  const handleDebugCode = async () => {
    setIsDebugging(true);
    setDebugResult('');
    try {
      const result = await debugCode({ code: codes[activeTab], language: activeTab });
      setDebugResult(result.suggestions);
      setIsDebugAlertOpen(true);
    } catch (error) {
      console.error(error);
      setDebugResult('An error occurred while debugging the code.');
      setIsDebugAlertOpen(true);
    } finally {
      setIsDebugging(false);
    }
  };

  const handleSaveSnippet = async () => {
    if (!snippetName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Snippet name cannot be empty.' });
      return;
    }
    
    setIsActionLoading(true);
    // The `code` property will now store the JSON string of the codes object.
    const snippetData: SnippetData = { name: snippetName, language: 'web-project', code: JSON.stringify(codes) };

    try {
      if (user) {
        await saveSnippet(user.uid, snippetData);
      } else {
        saveLocalSnippet(snippetData);
      }
      toast({ title: 'Success', description: 'Project saved successfully.' });
      await fetchSnippets(); // Refresh list
      setSnippetName('');
      setIsSaveOpen(false);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not save project.' });
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleLoadSnippet = (snippet: Snippet) => {
    try {
        const loadedCodes = JSON.parse(snippet.code);
        // Basic validation to ensure the loaded data is in the expected format
        if (loadedCodes.html !== undefined && loadedCodes.css !== undefined && loadedCodes.javascript !== undefined) {
          setCodes(loadedCodes);
          toast({ title: 'Project Loaded', description: `"${snippet.name}" has been loaded into the editor.` });
          setIsLoadOpen(false);
        } else {
          throw new Error("Invalid project format.");
        }
    } catch (e) {
        console.error("Failed to parse snippet:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load project. The data might be corrupted.' });
    }
  };
  
  const handleDeleteSnippet = async (id: string) => {
    setIsActionLoading(true);
    try {
        if (user) {
            await deleteSnippet(user.uid, id);
        } else {
            deleteLocalSnippet(id);
        }
        toast({ title: 'Project Deleted', description: 'The project has been removed.' });
        await fetchSnippets(); // Refresh list
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete project.' });
    } finally {
        setIsActionLoading(false);
    }
  }

  const handleDownload = () => {
    toast({ variant: 'destructive', title: 'Not Implemented', description: 'Downloading multi-file projects is not yet supported.' });
  };

  const handleUploadClick = () => {
     toast({ variant: 'destructive', title: 'Not Implemented', description: 'Uploading multi-file projects is not yet supported.' });
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[calc(100vh-8rem)]">
      <Card className="flex flex-col h-[60vh] md:h-full">
        <Tabs<string> defaultValue="html" className="flex-1 flex flex-col" onValueChange={(val) => setActiveTab(val as FileType)}>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Editor</CardTitle>
                <TabsList>
                    <TabsTrigger value="html">index.html</TabsTrigger>
                    <TabsTrigger value="css">style.css</TabsTrigger>
                    <TabsTrigger value="javascript">script.js</TabsTrigger>
                </TabsList>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <TabsContent value="html" className="flex-1 m-0">
                    <Textarea
                        value={codes.html}
                        onChange={(e) => handleCodeChange('html', e.target.value)}
                        className="flex-1 font-code text-sm bg-muted/50 resize-none h-full"
                        placeholder="Write your HTML here..."
                    />
                </TabsContent>
                <TabsContent value="css" className="flex-1 m-0">
                    <Textarea
                        value={codes.css}
                        onChange={(e) => handleCodeChange('css', e.target.value)}
                        className="flex-1 font-code text-sm bg-muted/50 resize-none h-full"
                        placeholder="Write your CSS here..."
                    />
                </TabsContent>
                <TabsContent value="javascript" className="flex-1 m-0">
                    <Textarea
                        value={codes.javascript}
                        onChange={(e) => handleCodeChange('javascript', e.target.value)}
                        className="flex-1 font-code text-sm bg-muted/50 resize-none h-full"
                        placeholder="Write your JavaScript here..."
                    />
                </TabsContent>
            </CardContent>
            <div className="p-6 pt-0 flex flex-wrap gap-2">
                <Button onClick={handleRun} className="bg-primary hover:bg-primary/90">
                    <Play className="mr-2 h-4 w-4" /> Run
                </Button>
                <Button onClick={handleDebugCode} disabled={isDebugging} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isDebugging ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Debugging...
                    </>
                ) : (
                    <>
                    <Bug className="mr-2 h-4 w-4" /> Debug
                    </>
                )}
                </Button>
                
                <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsSaveOpen(true)}>
                        <Save className="mr-2 h-4 w-4" /> Save
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsLoadOpen(true)}>
                        <FolderOpen className="mr-2 h-4 w-4" /> Load
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleDownload} disabled>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleUploadClick} disabled>
                        <Upload className="mr-2 h-4 w-4" /> Upload
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>

                <div className="hidden md:flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setIsSaveOpen(true)}><Save className="mr-2 h-4 w-4" /> Save</Button>
                    <Button variant="outline" onClick={() => setIsLoadOpen(true)}><FolderOpen className="mr-2 h-4 w-4" /> Load</Button>
                    <Button variant="outline" onClick={handleDownload} disabled><Download className="mr-2 h-4 w-4" /> Download</Button>
                    <Button variant="outline" onClick={handleUploadClick} disabled><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                </div>

                <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Save Project</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Projects are saved to your account if logged in, or to this browser otherwise.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span>Saving as {user ? 'user' : 'guest'}</span>
                    </div>
                    <Input
                    value={snippetName}
                    onChange={(e) => setSnippetName(e.target.value)}
                    placeholder="Enter project name"
                    />
                    <DialogFooter>
                    <Button onClick={handleSaveSnippet} disabled={isActionLoading}>
                        {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>

                <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                    <DialogTitle>Load Project</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>Showing projects for {user ? 'user' : 'guest'}</span>
                    </div>
                    <ScrollArea className="h-72">
                    {isActionLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                    <div className="flex flex-col gap-2 pr-4">
                        {snippets.length > 0 ? (
                        snippets.map((s) => (
                            <div key={s.id} className="group flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                            <button onClick={() => handleLoadSnippet(s)} className="text-left flex-1">
                                <p className="font-semibold">{s.name}</p>
                                <p className="text-sm text-muted-foreground">Web Project - {new Date(s.createdAt as string).toLocaleDateString()}</p>
                            </button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSnippet(s.id)} disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                            </Button>
                            </div>
                        ))
                        ) : (
                        <p className="text-muted-foreground text-center py-8">No saved projects.</p>
                        )}
                    </div>
                    )}
                    </ScrollArea>
                </DialogContent>
                </Dialog>
                
                <input
                type="file"
                ref={fileInputRef}
                onChange={() => {}}
                className="hidden"
                accept=".html,.css,.js,.zip"
                />
            </div>
        </Tabs>
      </Card>

      <Card className="flex flex-col h-[60vh] md:h-full">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden">
            <iframe
              srcDoc={previewDoc}
              title="Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0 bg-white"
            />
        </CardContent>
      </Card>
      
      <AlertDialog open={isDebugAlertOpen} onOpenChange={setIsDebugAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Debugging Assistant</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ScrollArea className="h-72 pr-4">
                 <div className="whitespace-pre-wrap font-sans text-sm">{debugResult}</div>
              </ScrollArea>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    