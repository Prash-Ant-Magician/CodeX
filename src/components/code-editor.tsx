
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveSnippet, getSnippets, deleteSnippet, saveLocalSnippet, getLocalSnippets, deleteLocalSnippet, Snippet, SnippetData } from '@/lib/snippets';
import { useAuth } from '@/lib/firebase/auth';
import { debugCode } from '@/ai/flows/debug-code';
import { generateCodeFromPrompt } from '@/ai/flows/generate-code-from-prompt';
import { Play, Bug, Save, FolderOpen, Loader2, Trash2, Download, Upload, MoreHorizontal, HelpCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CCompiler from './c-compiler';
import { cn } from '@/lib/utils';

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
    printf("Hello, C!");
    return 0;
}`
};

type Language = 'frontend' | 'html' | 'css' | 'javascript' | 'c';
type FileType = 'html' | 'css' | 'javascript';

export default function CodeEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('frontend');
  const [codes, setCodes] = useState(defaultCodes);
  const [activeTab, setActiveTab] = useState<FileType>('html');
  const [previewDoc, setPreviewDoc] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState('');
  const [isDebugAlertOpen, setIsDebugAlertOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetName, setSnippetName] = useState('');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const updatePreview = useCallback(() => {
    let combinedDoc = '';
    if (selectedLanguage === 'frontend') {
        combinedDoc = `
        <html>
            <head><style>${codes.frontend.css}</style></head>
            <body>
            ${codes.frontend.html}
            <script>${codes.frontend.javascript}</script>
            </body>
        </html>`;
    } else if (selectedLanguage === 'html') {
        combinedDoc = codes.html;
    } else {
        combinedDoc = `<html><body><p>Preview is only available for HTML and Frontend projects.</p></body></html>`;
    }

    const timeout = setTimeout(() => {
        setPreviewDoc(combinedDoc);
    }, 500);
    return () => clearTimeout(timeout);
  }, [codes, selectedLanguage]);

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
  }, [codes, selectedLanguage, updatePreview]);

  const handleCodeChange = (language: FileType, value: string) => {
    setCodes(prev => ({
      ...prev,
      frontend: { ...prev.frontend, [language]: value }
    }));
  };

  const handleSingleFileChange = (value: string) => {
    if (selectedLanguage !== 'frontend' && selectedLanguage !== 'c') {
      setCodes(prev => ({ ...prev, [selectedLanguage]: value }));
    }
  };
  
  const handleRun = () => {
    updatePreview();
    setIsPreviewVisible(true);
    toast({ title: 'Code Executed', description: 'Preview has been updated.' });
  };

  const handleDebugCode = async () => {
    setIsDebugging(true);
    setDebugResult('');
    try {
      let codeToDebug = '';
      let langToDebug = selectedLanguage;
      if (selectedLanguage === 'frontend') {
        codeToDebug = codes.frontend[activeTab];
        langToDebug = activeTab;
      } else {
        codeToDebug = codes[selectedLanguage];
      }
      const result = await debugCode({ code: codeToDebug, language: langToDebug });
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
    const codeToSave = selectedLanguage === 'frontend' ? JSON.stringify(codes.frontend) : codes[selectedLanguage as keyof typeof codes];
    const snippetData: SnippetData = { name: snippetName, language: selectedLanguage, code: codeToSave };

    try {
      if (user) {
        await saveSnippet(user.uid, snippetData);
      } else {
        saveLocalSnippet(snippetData);
      }
      toast({ title: 'Success', description: 'Snippet saved successfully.' });
      await fetchSnippets(); // Refresh list
      setSnippetName('');
      setIsSaveOpen(false);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not save snippet.' });
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleLoadSnippet = (snippet: Snippet) => {
    try {
      setSelectedLanguage(snippet.language as Language);
      if (snippet.language === 'frontend') {
        const loadedCodes = JSON.parse(snippet.code);
        if (loadedCodes.html !== undefined && loadedCodes.css !== undefined && loadedCodes.javascript !== undefined) {
          setCodes(prev => ({ ...prev, frontend: loadedCodes }));
        } else {
          throw new Error("Invalid project format.");
        }
      } else if (snippet.language === 'c') {
         // C compiler handles its own state, but we can update the shared state if needed.
         // For now, switching language to 'c' is enough as CCompiler component will be rendered.
      } else {
        setCodes(prev => ({ ...prev, [snippet.language]: snippet.code }));
      }
      toast({ title: 'Snippet Loaded', description: `"${snippet.name}" has been loaded into the editor.` });
      setIsLoadOpen(false);
    } catch (e) {
        console.error("Failed to parse snippet:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load snippet. The data might be corrupted.' });
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
        toast({ title: 'Snippet Deleted', description: 'The snippet has been removed.' });
        await fetchSnippets(); // Refresh list
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete snippet.' });
    } finally {
        setIsActionLoading(false);
    }
  }

  const handleGenerateCode = async () => {
    if (!aiPrompt) {
        toast({ variant: 'destructive', title: 'Error', description: 'Prompt cannot be empty.' });
        return;
    }
    setIsGenerating(true);
    try {
        let langForPrompt = selectedLanguage;
        if (selectedLanguage === 'frontend') {
            langForPrompt = activeTab;
        }

        const result = await generateCodeFromPrompt({ prompt: aiPrompt, language: langForPrompt });
        
        if (selectedLanguage === 'frontend') {
            handleCodeChange(activeTab, result.code);
        } else {
            handleSingleFileChange(result.code);
        }
        
        toast({ title: 'Code Generated', description: 'The AI has generated the code and placed it in the editor.' });
        setAiPrompt('');
        setIsAiGenerateOpen(false);
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate code.' });
    } finally {
        setIsGenerating(false);
    }
};

  const handleDownload = () => {
    toast({ variant: 'destructive', title: 'Not Implemented', description: 'Download is not yet supported.' });
  };

  const handleUploadClick = () => {
     toast({ variant: 'destructive', title: 'Not Implemented', description: 'Upload is not yet supported.' });
  };

  const renderEditor = () => {
    if (selectedLanguage === 'c') {
      return <CCompiler />;
    }

    return (
      <div className={cn(
          "grid grid-cols-1 gap-4 md:h-[calc(100vh-10rem)]",
          isPreviewVisible && "md:grid-cols-2"
        )}>
        <Card className="flex flex-col h-[60vh] md:h-full">
          {selectedLanguage === 'frontend' ? (
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
                  <Textarea value={codes.frontend.html} onChange={(e) => handleCodeChange('html', e.target.value)} className="flex-1 font-code text-sm bg-muted/50 resize-none h-full" placeholder="Write your HTML here..." />
                </TabsContent>
                <TabsContent value="css" className="flex-1 m-0">
                  <Textarea value={codes.frontend.css} onChange={(e) => handleCodeChange('css', e.target.value)} className="flex-1 font-code text-sm bg-muted/50 resize-none h-full" placeholder="Write your CSS here..." />
                </TabsContent>
                <TabsContent value="javascript" className="flex-1 m-0">
                  <Textarea value={codes.frontend.javascript} onChange={(e) => handleCodeChange('javascript', e.target.value)} className="flex-1 font-code text-sm bg-muted/50 resize-none h-full" placeholder="Write your JavaScript here..." />
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <>
              <CardHeader>
                <CardTitle>{selectedLanguage.toUpperCase()} Editor</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <Textarea value={codes[selectedLanguage as keyof typeof codes]} onChange={(e) => handleSingleFileChange(e.target.value)} className="flex-1 font-code text-sm bg-muted/50 resize-none h-full" placeholder={`Write your ${selectedLanguage.toUpperCase()} here...`} />
              </CardContent>
            </>
          )}

          <div className="p-6 pt-0 flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleRun} className="bg-primary hover:bg-primary/90" disabled={selectedLanguage === 'css' || selectedLanguage === 'javascript'}>
                  <Play className="mr-2 h-4 w-4" /> Run
                </Button>
                <Button onClick={handleDebugCode} disabled={isDebugging} variant="secondary">
                  {isDebugging ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Debugging...</> : <><Bug className="mr-2 h-4 w-4" /> Debug</>}
                </Button>
                 <Button onClick={() => setIsAiGenerateOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
                </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setIsSaveOpen(true)}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setIsLoadOpen(true)}><FolderOpen className="mr-2 h-4 w-4" /> Load</Button>
            </div>
          </div>
        </Card>
        
        {isPreviewVisible && (
            <Card className="flex flex-col h-[60vh] md:h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Preview</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsPreviewVisible(false)}>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden">
                <iframe srcDoc={previewDoc} title="Preview" sandbox="allow-scripts" className="w-full h-full border-0 bg-white" />
            </CardContent>
            </Card>
        )}

        {!isPreviewVisible && (
            <div className="absolute top-0 right-4">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsPreviewVisible(true)}>
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Show Preview</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <h1 className="text-2xl font-bold font-headline">Code Playground</h1>
            <div className="sm:ml-auto w-full sm:w-64">
                <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val as Language)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a language/mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="frontend">Frontend (HTML/CSS/JS)</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="css">CSS</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="c">C Language</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {renderEditor()}

        {/* Dialogs and Alerts */}
        <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Save Snippet</DialogTitle></DialogHeader>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><HelpCircle className="h-4 w-4" /></TooltipTrigger>
                  <TooltipContent><p>Snippets are saved to your account if logged in, or to this browser otherwise.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>Saving as {user ? 'user' : 'guest'}</span>
            </div>
            <Input value={snippetName} onChange={(e) => setSnippetName(e.target.value)} placeholder="Enter snippet name" />
            <DialogFooter>
              <Button onClick={handleSaveSnippet} disabled={isActionLoading}>
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Load Snippet</DialogTitle></DialogHeader>
            <div className="text-sm text-muted-foreground">Showing snippets for {user ? user.email : 'guest'}</div>
            <ScrollArea className="h-72">
              {isActionLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="flex flex-col gap-2 pr-4">
                  {snippets.length > 0 ? (
                    snippets.map((s) => (
                      <div key={s.id} className="group flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                        <button onClick={() => handleLoadSnippet(s)} className="text-left flex-1">
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.language.toUpperCase()} - {new Date(s.createdAt as string).toLocaleDateString()}</p>
                        </button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSnippet(s.id)} disabled={isActionLoading}>
                          {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No saved snippets.</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAiGenerateOpen} onOpenChange={setIsAiGenerateOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Code with AI</DialogTitle>
                    <DialogDescription>
                        Describe the code you want to generate. Be as specific as possible. The generated code will replace the content in the currently active editor tab.
                    </DialogDescription>
                </DialogHeader>
                <Textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'a login form with email and password fields' or 'a function that reverses a string'"
                    rows={4}
                />
                <DialogFooter>
                    <Button onClick={handleGenerateCode} disabled={isGenerating}>
                        {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDebugAlertOpen} onOpenChange={setIsDebugAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>AI Debugging Assistant</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <ScrollArea className="h-72 pr-4"><div className="whitespace-pre-wrap font-sans text-sm">{debugResult}</div></ScrollArea>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogAction>Got it!</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" accept=".html,.css,.js,.zip" />
    </div>
  );
}

    
