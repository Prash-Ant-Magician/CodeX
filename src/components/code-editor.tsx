
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveSnippet, getSnippets, deleteSnippet, Snippet } from '@/lib/snippets';
import { debugCode } from '@/ai/flows/debug-code';
import { compileCode } from '@/ai/flows/compile-code';
import { Play, Bug, Save, FolderOpen, Loader2, Trash2, Download, Upload, MoreHorizontal, Terminal, XCircle, CheckCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const languages = [
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' },
];

const defaultCode: Record<string, string> = {
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: sans-serif;
      background-color: #1a1a1a;
      color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    h1 {
      color: #3F51B5;
    }
  </style>
</head>
<body>
  <h1>Hello, CodeLeap!</h1>
</body>
</html>
`,
  css: `body {
  background-color: #1a1a1a;
  color: #f0f0f0;
  font-family: sans-serif;
}`,
  javascript: `console.log("Hello, CodeLeap!");`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
};

export default function CodeEditor() {
  const [language, setLanguage] = useState('html');
  const [code, setCode] = useState(defaultCode[language]);
  const [previewDoc, setPreviewDoc] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState('');
  const [isDebugAlertOpen, setIsDebugAlertOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetName, setSnippetName] = useState('');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileOutput, setCompileOutput] = useState<{ output: string; success: boolean } | null>(null);

  const updatePreview = useCallback(() => {
    if (language === 'html') {
      const timeout = setTimeout(() => {
        setPreviewDoc(code);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [code, language]);

  useEffect(() => {
    setCode(defaultCode[language]);
    setCompileOutput(null); // Reset output on language change
  }, [language]);
  
  useEffect(() => {
    const cleanup = updatePreview();
    return cleanup;
  }, [code, updatePreview]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSnippets(getSnippets());
    }
  }, []);

  const handleRunOrCompile = async () => {
    if (language === 'c') {
      setIsCompiling(true);
      setCompileOutput(null);
      try {
        const result = await compileCode({ code });
        setCompileOutput(result);
        toast({ title: 'Compilation Finished' });
      } catch (error) {
        console.error(error);
        setCompileOutput({ output: 'An unexpected error occurred during compilation.', success: false });
        toast({ variant: 'destructive', title: 'Error', description: 'Could not compile code.' });
      } finally {
        setIsCompiling(false);
      }
    } else {
      updatePreview();
      toast({ title: 'Code Executed', description: 'Preview has been updated.' });
    }
  };

  const handleDebugCode = async () => {
    setIsDebugging(true);
    setDebugResult('');
    try {
      const result = await debugCode({ code, language });
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

  const handleSaveSnippet = () => {
    if (!snippetName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Snippet name cannot be empty.' });
      return;
    }
    const result = saveSnippet({ name: snippetName, language, code });
    if (result) {
      toast({ title: 'Success', description: 'Snippet saved successfully.' });
      setSnippets(getSnippets());
      setSnippetName('');
      setIsSaveOpen(false);
    } else {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not save snippet.' });
    }
  };

  const handleLoadSnippet = (snippet: Snippet) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    toast({ title: 'Snippet Loaded', description: `"${snippet.name}" has been loaded into the editor.` });
    setIsLoadOpen(false);
  };
  
  const handleDeleteSnippet = (id: string) => {
    deleteSnippet(id);
    setSnippets(getSnippets());
    toast({ title: 'Snippet Deleted', description: 'The snippet has been removed.' });
  }

  const handleDownload = () => {
    if (!code) {
      toast({ variant: 'destructive', title: 'Error', description: 'There is no code to download.' });
      return;
    }
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const extension = languages.find(l => l.value === language)?.value || 'txt';
    link.download = `codeleap-snippet.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'File downloaded successfully.' });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCode(text);
        toast({ title: 'File Uploaded', description: 'File content loaded into the editor.' });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[calc(100vh-8rem)]">
      <Card className="flex flex-col h-[60vh] md:h-full">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Editor</CardTitle>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 font-code text-sm bg-muted/50 resize-none"
            placeholder="Write your code here..."
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRunOrCompile} disabled={isCompiling} className="bg-primary hover:bg-primary/90">
              {isCompiling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Compiling...
                </>
              ) : (
                language === 'c' ? (
                  <>
                    <Terminal className="mr-2 h-4 w-4" /> Compile
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Run
                  </>
                )
              )}
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
                  <DropdownMenuItem onSelect={handleDownload}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleUploadClick}>
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden md:flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setIsSaveOpen(true)}><Save className="mr-2 h-4 w-4" /> Save</Button>
                <Button variant="outline" onClick={() => setIsLoadOpen(true)}><FolderOpen className="mr-2 h-4 w-4" /> Load</Button>
                <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
                <Button variant="outline" onClick={handleUploadClick}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            </div>

            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Snippet</DialogTitle>
                </DialogHeader>
                <Input
                  value={snippetName}
                  onChange={(e) => setSnippetName(e.target.value)}
                  placeholder="Enter snippet name"
                />
                <DialogFooter>
                  <Button onClick={handleSaveSnippet}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Load Snippet</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-72">
                  <div className="flex flex-col gap-2 pr-4">
                    {snippets.length > 0 ? (
                      snippets.map((s) => (
                        <div key={s.id} className="group flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                          <button onClick={() => handleLoadSnippet(s)} className="text-left flex-1">
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-sm text-muted-foreground">{s.language} - {new Date(s.createdAt).toLocaleDateString()}</p>
                          </button>
                           <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSnippet(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No saved snippets.</p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".html,.css,.js,.txt,.c"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-[60vh] md:h-full">
        <CardHeader>
          <CardTitle>{language === 'c' ? 'Compiler Output' : 'Preview'}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden">
          {language === 'c' ? (
            <div className="w-full h-full bg-black text-white font-code p-4 overflow-auto">
              {compileOutput ? (
                <div>
                  <div className={cn("flex items-center gap-2 mb-4", compileOutput.success ? 'text-green-400' : 'text-red-400')}>
                    {compileOutput.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <span className="font-bold text-lg">{compileOutput.success ? 'Success' : 'Failed'}</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{compileOutput.output}</pre>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Terminal className="h-5 w-5" />
                  <span>Awaiting compilation...</span>
                </div>
              )}
            </div>
          ) : (
            <iframe
              srcDoc={previewDoc}
              title="Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0 bg-white"
            />
          )}
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
