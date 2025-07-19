
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
import { Play, Bug, Save, FolderOpen, Loader2, Trash2, Download, Upload } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

const languages = [
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'javascript', label: 'JavaScript' },
];

const defaultCode = `<!DOCTYPE html>
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
`;

export default function CodeEditor() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('html');
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

  const updatePreview = useCallback(() => {
    const timeout = setTimeout(() => {
      setPreviewDoc(code);
    }, 500);
    return () => clearTimeout(timeout);
  }, [code]);

  useEffect(() => {
    if (language === 'html') {
      const cleanup = updatePreview();
      return cleanup;
    }
  }, [code, language, updatePreview]);

  useEffect(() => {
    setSnippets(getSnippets());
  }, []);

  const handleRunCode = () => {
    updatePreview();
    toast({ title: 'Code Executed', description: 'Preview has been updated.' });
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
    saveSnippet({ name: snippetName, language, code });
    toast({ title: 'Success', description: 'Snippet saved successfully.' });
    setSnippets(getSnippets());
    setSnippetName('');
    setIsSaveOpen(false);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[calc(100vh-8rem)]">
      <Card className="flex flex-col">
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
            <Button onClick={handleRunCode} className="bg-primary hover:bg-primary/90">
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
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save</Button>
              </DialogTrigger>
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
              <DialogTrigger asChild>
                <Button variant="outline"><FolderOpen className="mr-2 h-4 w-4" /> Load</Button>
              </DialogTrigger>
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
            <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
            <Button variant="outline" onClick={handleUploadClick}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".html,.css,.js,.txt"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
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
                <pre className="whitespace-pre-wrap font-sans text-sm">{debugResult}</pre>
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

    