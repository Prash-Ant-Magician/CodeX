
"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/firebase/auth';
import { debugCode } from '@/ai/flows/debug-code';
import { generateCodeFromPrompt } from '@/ai/flows/generate-code-from-prompt';
import { suggestCode } from '@/ai/flows/suggest-code';
import { Play, Bug, Save, FolderOpen, Loader2, Trash2, Sparkles, Lightbulb, CornerDownLeft, Share2, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSettings } from './settings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type AllCodes } from './main-layout';
import { runPythonCode } from '@/ai/flows/run-python';
import { runJavaCode } from '@/ai/flows/run-java';
import { runTypescriptCode } from '@/ai/flows/run-typescript';
import { compileCode } from '@/ai/flows/compile-code';
import { runRCode } from '@/ai/flows/run-r';
import { runRubyCode } from '@/ai/flows/run-ruby';
import RunHistory, { type HistoryEntry } from './run-history';
import { Snippet } from '@/lib/snippets';
import { playKeystrokeSound } from '@/lib/sounds';

/* ---------- types ---------- */
type Language = 'frontend' | 'html' | 'css' | 'javascript' | 'typescript' | 'c' | 'python' | 'java' | 'ruby' | 'r';
type FileType = 'html' | 'css' | 'javascript';
type BackendLanguage = 'c' | 'python' | 'java' | 'typescript' | 'ruby' | 'r';

interface CodeEditorProps {
  codes: AllCodes;
  selectedLanguage: Language;
  setSelectedLanguage: React.Dispatch<React.SetStateAction<Language>>;
  onFrontendCodeChange: (file: FileType, newCode: string) => void;
  onCodeChange: (language: Language, newCode: string) => void;
  onShare: (code: string, language: string) => void;
  snippets: Snippet[];
  fetchSnippets: () => Promise<void>;
  onSaveSnippet: (name: string, lang: Language) => Promise<void>;
  onLoadSnippet: (snippet: Snippet) => void;
  onDeleteSnippet: (id: string) => Promise<void>;
}

/* ---------- cursor saver ---------- */
function useEditorCursor() {
  const posRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  const onMount = (editor: any) => {
    editorRef.current = editor;
    if (posRef.current) {
      editor.setPosition(posRef.current);
      editor.focus();
    }
  };

  const beforeUpdate = () => {
    if (editorRef.current) posRef.current = editorRef.current.getPosition();
  };

  return { onMount, beforeUpdate };
}

/* ---------- debounced editor ---------- */
const StableEditor = React.memo(
  ({
    language,
    value,
    onChange,
    options,
    isSyntaxHighlightingEnabled,
    theme,
    onMount,
  }: {
    language: string;
    value: string;
    onChange: (v: string | undefined) => void;
    options: any;
    isSyntaxHighlightingEnabled: boolean;
    theme: string;
    onMount: (editor: any) => void;
  }) => {
    return (
      <Editor
        height="100%"
        language={isSyntaxHighlightingEnabled ? language : 'plaintext'}
        value={value}
        theme={theme}
        onChange={onChange}
        options={options}
        onMount={onMount}
        loading={<Loader2 className="h-8 w-8 animate-spin" />}
      />
    );
  },
);
StableEditor.displayName = 'StableEditor';


const StableEditorWrapper = ({
  language,
  value,
  onChange,
  options,
  isSyntaxHighlightingEnabled,
  theme,
}: {
  language: string;
  value: string;
  onChange: (v: string | undefined) => void;
  options: any;
  isSyntaxHighlightingEnabled: boolean;
  theme: string;
}) => {
    const cursor = useEditorCursor();
    const { isTypingSoundEnabled } = useSettings();

    useEffect(() => {
      cursor.beforeUpdate();
    }, [value, cursor]);

    const handleCodeChange = (v: string | undefined) => {
        if (isTypingSoundEnabled) {
            playKeystrokeSound();
        }
        onChange(v);
    }

    return (
      <StableEditor
        language={language}
        value={value}
        onChange={handleCodeChange}
        options={options}
        isSyntaxHighlightingEnabled={isSyntaxHighlightingEnabled}
        theme={theme}
        onMount={cursor.onMount}
      />
    );
}
StableEditorWrapper.displayName = 'StableEditorWrapper';


/* ---------- main component ---------- */
export default function CodeEditor({
  codes,
  selectedLanguage,
  setSelectedLanguage,
  onFrontendCodeChange,
  onCodeChange,
  onShare,
  snippets,
  fetchSnippets,
  onSaveSnippet,
  onLoadSnippet,
  onDeleteSnippet,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<FileType>('html');
  const [previewDoc, setPreviewDoc] = useState('about:blank');
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState('');
  const [isDebugAlertOpen, setIsDebugAlertOpen] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const [backendOutput, setBackendOutput] = useState('');
  const [backendError, setBackendError] = useState('');
  const [isBackendRunning, setIsBackendRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const { toast } = useToast();
  const { user } = useAuth();
  const { isAiSuggestionsEnabled, editorFontSize, tabSize, autoBrackets, editorTheme, isSyntaxHighlightingEnabled } = useSettings();

  /* ---------- helpers ---------- */
  const isBackendLang = ['c', 'python', 'java', 'typescript', 'ruby', 'r'].includes(selectedLanguage);
  const isWebPreviewable = ['frontend', 'html', 'javascript', 'css'].includes(selectedLanguage);

  const loadHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(`runHistory-${selectedLanguage}`);
    setHistory(saved ? JSON.parse(saved) : []);
  }, [selectedLanguage]);

  const addToHistory = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
      const newEntry = { ...entry, id: Date.now().toString(), timestamp: new Date().toISOString() };
      const newHistory = [newEntry, ...history];
      setHistory(newHistory);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`runHistory-${selectedLanguage}`, JSON.stringify(newHistory));
      }
    },
    [history, selectedLanguage],
  );
  
  const handleSaveFlow = async () => {
      if (!snippetName) {
        toast({ variant: 'destructive', title: 'Error', description: 'Snippet name cannot be empty.' });
        return;
      }
      setIsActionLoading(true);
      await onSaveSnippet(snippetName, selectedLanguage);
      setIsActionLoading(false);
      setSnippetName('');
      setIsSaveOpen(false);
  }

  const handleLoadFlow = (snippet: Snippet) => {
      onLoadSnippet(snippet);
      setIsLoadOpen(false);
  };
  
  const handleDeleteFlow = async (id: string) => {
      setIsActionLoading(true);
      await onDeleteSnippet(id);
      setIsActionLoading(false);
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
            onFrontendCodeChange(activeTab, result.code);
        } else {
            onCodeChange(selectedLanguage, result.code)
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

  useEffect(() => loadHistory(), [loadHistory]);
  
  useEffect(() => {
    if (isLoadOpen) {
      fetchSnippets();
    }
  }, [isLoadOpen, fetchSnippets]);

  /* ---------- live preview ---------- */

  const updatePreview = useCallback(() => {
    if (!isWebPreviewable) return;
    let doc = '';
    if (selectedLanguage === 'frontend') {
      doc = `<html><head><style>${codes.frontend.css}</style></head><body>${codes.frontend.html}<script>${codes.frontend.javascript}</script></body></html>`;
    } else if (selectedLanguage === 'html') {
      doc = codes.html;
    } else if (selectedLanguage === 'javascript') {
      doc = `<html><body><script>${codes.javascript}</script></body></html>`;
    }  else if (selectedLanguage === 'css') {
      doc = `<html><head><style>${codes.css}</style></head><body><h1>CSS Preview</h1><p>This is a paragraph styled by your CSS.</p></body></html>`;
    }
    setPreviewDoc(`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`);
  }, [codes, selectedLanguage, isWebPreviewable]);

  /* ---------- backend run ---------- */
  const handleRunBackend = useCallback(
    async (lang: BackendLanguage) => {
      setIsBackendRunning(true);
      setBackendOutput('');
      setBackendError('');
      try {
        const code = codes[lang];
        let result: any = null;
        switch (lang) {
          case 'python': result = await runPythonCode({ code }); break;
          case 'java': result = await runJavaCode({ code }); break;
          case 'typescript': result = await runTypescriptCode({ code }); break;
          case 'c': result = await compileCode({ code }); break;
          case 'r': result = await runRCode({ code }); break;
          case 'ruby': result = await runRubyCode({ code }); break;
        }
        if (result?.success) {
          const out = result.executionOutput || result.compilationOutput || '';
          setBackendOutput(out);
          addToHistory({ code, result: { success: true, output: out } });
        } else {
          const err = result?.errorOutput || result?.compilationOutput || 'Unknown error';
          setBackendError(err);
          addToHistory({ code, result: { success: false, output: err } });
        }
      } catch {
        const err = 'Unexpected error';
        setBackendError(err);
        addToHistory({ code: codes[lang], result: { success: false, output: err } });
      } finally {
        setIsBackendRunning(false);
      }
    },
    [codes, addToHistory],
  );

  /* ---------- ui handlers ---------- */
  const handleRun = () => {
    if(isBackendLang) {
      handleRunBackend(selectedLanguage as BackendLanguage)
    } else {
      updatePreview();
      toast({title: 'Preview Updated', description: 'Your preview has been updated with the latest code.'});
    }
  };

  const handleDebugCode = async () => {
    setIsDebugging(true);
    try {
      let code = '';
      let lang = selectedLanguage;
      if (selectedLanguage === 'frontend') {
        code = codes.frontend[activeTab];
        lang = activeTab;
      } else {
        code = codes[selectedLanguage as Exclude<Language, 'frontend'>];
      }
      const res = await debugCode({ code, language: lang });
      setDebugResult(res.suggestions);
      setIsDebugAlertOpen(true);
    } finally {
      setIsDebugging(false);
    }
  };

  const handleShareToForum = () => {
    let codeToShare: string;
    let langToShare: string;
    if (selectedLanguage === 'frontend') {
      codeToShare = `HTML:\n\`\`\`html\n${codes.frontend.html}\n\`\`\`\n\nCSS:\n\`\`\`css\n${codes.frontend.css}\n\`\`\`\n\nJavaScript:\n\`\`\`javascript\n${codes.frontend.javascript}\n\`\`\``;
      langToShare = 'web';
    } else {
      codeToShare = codes[selectedLanguage as Exclude<Language, 'frontend'>];
      langToShare = selectedLanguage;
    }
    onShare(codeToShare, langToShare);
  };
  
  const handleSuggestCode = async () => {
    setIsSuggesting(true);
    setSuggestion('');
    try {
      let codeToSuggest = '';
      let langToSuggest = selectedLanguage;
      if (selectedLanguage === 'frontend') {
        codeToSuggest = codes.frontend[activeTab];
        langToSuggest = activeTab;
      } else {
        codeToSuggest = codes[selectedLanguage as Exclude<Language, 'frontend'>];
      }
      const result = await suggestCode({ code: codeToSuggest, language: langToSuggest });
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to get suggestion.' });
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleInsertSuggestion = () => {
    if (selectedLanguage === 'frontend') {
      const currentCode = codes.frontend[activeTab];
      onFrontendCodeChange(activeTab, currentCode + suggestion);
    } else {
      const currentCode = codes[selectedLanguage as keyof AllCodes] as string;
      onCodeChange(selectedLanguage, currentCode + suggestion);
    }
    setSuggestion('');
  };

  const editorOptions = useMemo(
    () => ({
      fontSize: editorFontSize === 'small' ? 12 : editorFontSize === 'medium' ? 14 : 16,
      tabSize,
      autoClosingBrackets: autoBrackets ? 'always' : 'never',
      minimap: { enabled: false },
      wordWrap: 'on',
      fontFamily: 'Source Code Pro, monospace',
    }),
    [editorFontSize, tabSize, autoBrackets],
  );

  /* ---------- render ---------- */
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <h1 className="text-2xl font-bold font-headline">Code Playground</h1>
        <div className="sm:ml-auto flex items-center gap-2">
          <Select value={selectedLanguage} onValueChange={(v) => setSelectedLanguage(v as Language)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frontend">Frontend (HTML/CSS/JS)</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="c">C</SelectItem>
              <SelectItem value="ruby">Ruby</SelectItem>
              <SelectItem value="r">R</SelectItem>
            </SelectContent>
          </Select>
          {isWebPreviewable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsPreviewVisible(!isPreviewVisible)}>
                    {isPreviewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPreviewVisible ? 'Hide' : 'Show'} Preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-4 md:h-[calc(100vh-10rem)]',
          isWebPreviewable && isPreviewVisible ? 'md:grid-cols-2' : 'md:grid-cols-1',
        )}
      >
        {/* ---- editor card ---- */}
        <Card className="flex flex-col h-[80vh] md:h-full">
          {selectedLanguage === 'frontend' ? (
            <Tabs defaultValue="html" className="flex-1 flex flex-col" onValueChange={(v) => setActiveTab(v as FileType)}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Editor</CardTitle>
                  <CardDescription>Multi-file editor for web projects.</CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="html">index.html</TabsTrigger>
                  <TabsTrigger value="css">style.css</TabsTrigger>
                  <TabsTrigger value="javascript">script.js</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <TabsContent value="html" className="flex-1 m-0">
                  <StableEditorWrapper language="html" value={codes.frontend.html} onChange={(v) => onFrontendCodeChange('html', v || '')} options={editorOptions} isSyntaxHighlightingEnabled={isSyntaxHighlightingEnabled} theme={editorTheme} />
                </TabsContent>
                <TabsContent value="css" className="flex-1 m-0">
                  <StableEditorWrapper language="css" value={codes.frontend.css} onChange={(v) => onFrontendCodeChange('css', v || '')} options={editorOptions} isSyntaxHighlightingEnabled={isSyntaxHighlightingEnabled} theme={editorTheme} />
                </TabsContent>
                <TabsContent value="javascript" className="flex-1 m-0">
                  <StableEditorWrapper language="javascript" value={codes.frontend.javascript} onChange={(v) => onFrontendCodeChange('javascript', v || '')} options={editorOptions} isSyntaxHighlightingEnabled={isSyntaxHighlightingEnabled} theme={editorTheme} />
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-4 h-full">
              <CardHeader>
                <CardTitle>{selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Editor</CardTitle>
                <CardDescription>Write and execute {selectedLanguage} code.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <StableEditorWrapper language={selectedLanguage} value={codes[selectedLanguage as keyof Omit<AllCodes, 'frontend'>]} onChange={(v) => onCodeChange(selectedLanguage, v || '')} options={editorOptions} isSyntaxHighlightingEnabled={isSyntaxHighlightingEnabled} theme={editorTheme} />
              </CardContent>
            </div>
          )}

          <CardFooter className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRun} disabled={isBackendRunning} className="bg-primary hover:bg-primary/90">
                {isBackendRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Run
              </Button>
              <Button onClick={handleDebugCode} disabled={isDebugging} variant="secondary">
                {isDebugging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />} Debug
              </Button>
              <Button onClick={() => setIsAiGenerateOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Sparkles className="mr-2 h-4 w-4" /> Generate
              </Button>
               {isAiSuggestionsEnabled && (
                  <Popover onOpenChange={(open) => { if(!open) setSuggestion('')}}>
                      <PopoverTrigger asChild>
                         <Button variant="outline" onClick={handleSuggestCode} disabled={isSuggesting} size="icon" aria-label="Get AI suggestion">
                              {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                         {isSuggesting ? (
                              <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>
                          ) : suggestion ? (
                              <div className="grid gap-4">
                                <div className="space-y-2"><h4 className="font-medium leading-none">AI Suggestion</h4><p className="text-sm text-muted-foreground">The AI suggests the following code.</p></div>
                                <pre className="bg-muted p-2 rounded-md overflow-x-auto text-sm font-code">{suggestion}</pre>
                                <Button onClick={handleInsertSuggestion} size="sm"><CornerDownLeft className="mr-2 h-4 w-4" /> Insert</Button>
                              </div>
                          ) : (
                              <p className="p-4 text-sm text-center text-muted-foreground">No suggestion available.</p>
                          )}
                      </PopoverContent>
                    </Popover>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setIsSaveOpen(true)}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setIsLoadOpen(true)}><FolderOpen className="mr-2 h-4 w-4" /> Load</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleShareToForum}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                  </TooltipTrigger>
                  <TooltipContent>Share to Forum</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardFooter>
        </Card>

        {/* ---- preview / result ---- */}
        {isWebPreviewable && isPreviewVisible && (
          <Card className="flex flex-col h-[80vh] md:h-full">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden">
              <iframe src={previewDoc} title="Preview" sandbox="allow-scripts" className="w-full h-full border-0 bg-white" />
            </CardContent>
          </Card>
        )}

        {isBackendLang && (
          <Card className="flex-1 flex flex-col h-[80vh] md:h-full">
            <Tabs defaultValue="output" className="flex-1 flex flex-col">
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Result</CardTitle>
                <TabsList>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <TabsContent value="output" className="h-full m-0">
                  {isBackendRunning ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : backendError ? (
                    <pre className="text-destructive whitespace-pre-wrap p-4 font-mono text-sm">{backendError}</pre>
                  ) : (
                    <pre className="whitespace-pre-wrap p-4 font-mono text-sm">{backendOutput}</pre>
                  )}
                </TabsContent>
                <TabsContent value="history" className="h-full m-0">
                  <RunHistory history={history} onRestore={(c) => selectedLanguage !== 'frontend' && onCodeChange(selectedLanguage, c)} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        )}
      </div>

      {/* ---------- dialogs ---------- */}
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Snippet</DialogTitle>
            <DialogDescription>{user ? 'Your snippet will be saved to your account.' : 'You are not logged in. Snippets will be saved to this browser only.'}</DialogDescription>
          </DialogHeader>
          <Input value={snippetName} onChange={(e) => setSnippetName(e.target.value)} placeholder="Enter snippet name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFlow} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load Snippet</DialogTitle>
            <DialogDescription>Showing snippets for {user?.email ?? 'this browser'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 -mx-6">
            {isActionLoading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : snippets.length ? (
              <div className="flex flex-col gap-2 px-6">
                {snippets.map((s) => (
                  <div key={s.id} className="group flex items-center justify-between border p-3 rounded-md hover:bg-muted/50 transition-colors">
                    <button onClick={() => { handleLoadFlow(s); }} className="text-left flex-1">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.language.toUpperCase()} – {new Date(s.createdAt as string).toLocaleDateString()}</p>
                    </button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleDeleteFlow(s.id)} disabled={isActionLoading}>
                           {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Snippet</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No saved snippets.</p>
            )}
          </ScrollArea>
          <DialogFooter><Button variant="outline" onClick={() => setIsLoadOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiGenerateOpen} onOpenChange={setIsAiGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Code with AI</DialogTitle>
            <DialogDescription>Describe the code you want to generate. The generated code will replace the content in the currently active editor tab.</DialogDescription>
          </DialogHeader>
          <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. a todo list in React" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateCode} disabled={isGenerating}>
              {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDebugAlertOpen} onOpenChange={setIsDebugAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Debugging Assistant</AlertDialogTitle>
            <AlertDialogDescription asChild>
                <ScrollArea className="h-72 pr-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{debugResult}</pre>
                </ScrollArea>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    