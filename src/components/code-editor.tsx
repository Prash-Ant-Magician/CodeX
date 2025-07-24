
"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveSnippet, getSnippets, deleteSnippet, saveLocalSnippet, getLocalSnippets, deleteLocalSnippet, Snippet, SnippetData } from '@/lib/snippets';
import { useAuth } from '@/lib/firebase/auth';
import { debugCode } from '@/ai/flows/debug-code';
import { generateCodeFromPrompt } from '@/ai/flows/generate-code-from-prompt';
import { suggestCode } from '@/ai/flows/suggest-code';
import { Play, Bug, Save, FolderOpen, Loader2, Trash2, Sparkles, ChevronDown, ChevronUp, Lightbulb, CornerDownLeft, Share2, AlertTriangle, CheckCircle, History } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSettings } from './settings';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { type AllCodes } from './main-layout';
import { compileCode } from '@/ai/flows/compile-code';
import { runPythonCode } from '@/ai/flows/run-python';
import { runJavaCode } from '@/ai/flows/run-java';
import { runTypescriptCode } from '@/ai/flows/run-typescript';
import { runRubyCode } from '@/ai/flows/run-ruby';
import { runRCode } from '@/ai/flows/run-r';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import RunHistory, { type HistoryEntry } from './run-history';
import { Textarea } from './ui/textarea';


type Language = 'frontend' | 'html' | 'css' | 'javascript' | 'typescript' | 'c' | 'python' | 'java' | 'ruby' | 'r';
type FileType = 'html' | 'css' | 'javascript';

interface CodeEditorProps {
    codes: AllCodes;
    setCodes: React.Dispatch<React.SetStateAction<AllCodes>>;
    onShare: (code: string, language: string) => void;
}

const LOCAL_STORAGE_KEY_PREFIX = 'codeleap-run-history-';

export default function CodeEditor({ codes, setCodes, onShare }: CodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('frontend');
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
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  
  // States for backend runners
  const [isRunnerLoading, setIsRunnerLoading] = useState(false);
  const [runnerResult, setRunnerResult] = useState<any>(null);
  const [runHistory, setRunHistory] = useState<HistoryEntry[]>([]);

  const { toast } = useToast();
  const { user } = useAuth();
  const { isAiSuggestionsEnabled, editorFontSize, tabSize, autoBrackets, isTypingSoundEnabled, editorTheme, isSyntaxHighlightingEnabled } = useSettings();
  
  const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${selectedLanguage}`;

  const handleCodeForLanguage = (lang: Language, newCode: string) => {
    setCodes(prev => ({...prev, [lang]: newCode}));
  }

  React.useEffect(() => {
    if (!['frontend', 'html', 'css', 'javascript'].includes(selectedLanguage)) {
        try {
          const savedHistory = localStorage.getItem(storageKey);
          if (savedHistory) {
            setRunHistory(JSON.parse(savedHistory));
          } else {
            setRunHistory([]);
          }
        } catch (error) {
            console.error("Could not load run history from local storage:", error);
            setRunHistory([]);
        }
    }
  }, [selectedLanguage, storageKey]);


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

  React.useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);
  
  React.useEffect(() => {
    const cleanup = updatePreview();
    return cleanup;
  }, [codes, selectedLanguage, updatePreview]);

  const handleCodeChange = (language: FileType, value: string | undefined) => {
    if (value === undefined) return;
    setCodes(prev => ({
      ...prev,
      frontend: { ...prev.frontend, [language]: value }
    }));
  };

  const handleSingleFileChange = (value: string | undefined) => {
    if (value === undefined) return;
    if (selectedLanguage !== 'frontend') {
      handleCodeForLanguage(selectedLanguage, value);
    }
  };
  
  const handleRun = () => {
     if (['c', 'python', 'java', 'typescript', 'ruby', 'r'].includes(selectedLanguage)) {
        handleBackendRun();
    } else {
        updatePreview();
        setIsPreviewVisible(true);
        toast({ title: 'Code Executed', description: 'Preview has been updated.' });
    }
  };

  const handleBackendRun = async () => {
    const code = codes[selectedLanguage as keyof typeof codes] as string;
    if (!code) return;

    setIsRunnerLoading(true);
    setRunnerResult(null);
    let output;

    try {
        switch(selectedLanguage) {
            case 'c': output = await compileCode({ code }); break;
            case 'python': output = await runPythonCode({ code }); break;
            case 'java': output = await runJavaCode({ code }); break;
            case 'typescript': output = await runTypescriptCode({ code }); break;
            case 'ruby': output = await runRubyCode({ code }); break;
            case 'r': output = await runRCode({ code }); break;
            default: throw new Error("Unsupported language for backend execution.");
        }
        setRunnerResult(output);
      
        const newHistoryEntry: HistoryEntry = {
            id: new Date().toISOString(),
            code,
            result: output,
            timestamp: new Date().toISOString()
        };
        const updatedHistory = [newHistoryEntry, ...runHistory].slice(0, 50);
        setRunHistory(updatedHistory);
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while running the code.' });
    } finally {
      setIsRunnerLoading(false);
    }
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
        codeToDebug = codes[selectedLanguage as Exclude<Language, 'frontend'>];
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

  const handleShareToForum = () => {
    let codeToShare: string;
    let langToShare: string;
    if (selectedLanguage === 'frontend') {
        codeToShare = codes.frontend[activeTab];
        langToShare = activeTab;
    } else {
        codeToShare = codes[selectedLanguage as Exclude<Language, 'frontend'>];
        langToShare = selectedLanguage;
    }
    onShare(codeToShare, langToShare);
  };

  const handleSaveSnippet = async () => {
    if (!snippetName) {
      toast({ variant: 'destructive', title: 'Error', description: 'Snippet name cannot be empty.' });
      return;
    }
    
    setIsActionLoading(true);
    let codeToSave;
    if (selectedLanguage === 'frontend') {
      codeToSave = JSON.stringify(codes.frontend);
    } else {
      codeToSave = codes[selectedLanguage as keyof AllCodes] as string;
    }
    
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
      const lang = snippet.language as Language;
      setSelectedLanguage(lang);
      if (lang === 'frontend') {
        const loadedCodes = JSON.parse(snippet.code);
        if (loadedCodes.html !== undefined && loadedCodes.css !== undefined && loadedCodes.javascript !== undefined) {
          setCodes(prev => ({ ...prev, frontend: loadedCodes }));
        } else {
          throw new Error("Invalid project format.");
        }
      } else {
        setCodes(prev => ({ ...prev, [lang]: snippet.code }));
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
            handleCodeForLanguage(selectedLanguage, result.code)
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
      handleCodeChange(activeTab, currentCode + suggestion);
    } else {
      const currentCode = codes[selectedLanguage as keyof AllCodes] as string;
      handleSingleFileChange(currentCode + suggestion);
    }
    setSuggestion('');
  };
  
  const handleClearHistory = () => {
    setRunHistory([]);
    localStorage.removeItem(storageKey);
    toast({ description: "Run history cleared." });
  };

  const editorOptions = {
      fontSize: editorFontSize === 'small' ? 12 : editorFontSize === 'medium' ? 14 : 16,
      tabSize: tabSize,
      autoClosingBrackets: autoBrackets ? 'always' : 'never',
      minimap: { enabled: false },
      wordWrap: 'on',
      fontFamily: 'Source Code Pro, monospace',
  };

  const renderMonacoEditor = (language: string, value: string, onChange: (value: string | undefined) => void) => {
    return (
        <div className="flex-1 w-full h-full bg-muted/50 rounded-md overflow-hidden">
            <Editor
                height="100%"
                language={isSyntaxHighlightingEnabled ? language : 'plaintext'}
                value={value}
                theme={editorTheme}
                onChange={onChange}
                options={editorOptions}
                loading={<Loader2 className="h-8 w-8 animate-spin" />}
            />
        </div>
    );
  }

  const renderBackendRunner = () => {
    const currentCode = codes[selectedLanguage as keyof AllCodes] as string;
    const isCompilerLanguage = ['c', 'java', 'typescript'].includes(selectedLanguage);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[calc(100vh-10rem)]">
            <Card className="flex flex-col h-[60vh] md:h-full">
                <CardHeader>
                    <CardTitle>{selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Editor</CardTitle>
                    <CardDescription>Write and run {selectedLanguage} code. The AI will simulate execution.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                     {renderMonacoEditor(selectedLanguage, currentCode, handleSingleFileChange)}
                </CardContent>
                <CardFooter className="flex justify-between">
                     <div className="flex gap-2">
                        <Button onClick={handleRun} disabled={isRunnerLoading} className="bg-primary hover:bg-primary/90">
                            {isRunnerLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</> : <><Play className="mr-2 h-4 w-4" /> Run</>}
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
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">AI Suggestion</h4>
                                        <p className="text-sm text-muted-foreground">The AI suggests the following code.</p>
                                      </div>
                                      <pre className="bg-muted p-2 rounded-md overflow-x-auto text-sm font-code">{suggestion}</pre>
                                      <Button onClick={handleInsertSuggestion} size="sm"><CornerDownLeft className="mr-2 h-4 w-4" /> Insert</Button>
                                    </div>
                                ) : (
                                    <p className="p-4 text-sm text-center text-muted-foreground">Click the button to generate a suggestion.</p>
                                )}
                              </PopoverContent>
                          </Popover>
                        )}
                     </div>
                </CardFooter>
            </Card>
             <Card className="flex flex-col h-[60vh] md:h-full">
                <Tabs defaultValue="output" className="flex-1 flex flex-col">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="output">Output</TabsTrigger>
                            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> History ({runHistory.length})</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                     <TabsContent value="output" className="flex-1 bg-muted/50 rounded-b-lg overflow-y-auto p-4 m-0">
                        {isRunnerLoading ? (
                            <div className="flex items-center justify-center h-full"><Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /><p>Running code...</p></div>
                        ): runnerResult ? (
                            <div className="flex flex-col gap-4">
                                {isCompilerLanguage ? (
                                    <>
                                        {runnerResult.success ? (
                                            <Alert className="border-green-500/50 text-green-500"><CheckCircle className="h-4 w-4" /><AlertTitle>Compilation Successful</AlertTitle><AlertDescription className="font-code whitespace-pre-wrap">{runnerResult.compilationOutput}</AlertDescription></Alert>
                                        ) : (
                                            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Compilation Failed</AlertTitle><AlertDescription className="font-code whitespace-pre-wrap">{runnerResult.compilationOutput}</AlertDescription></Alert>
                                        )}
                                        {runnerResult.executionOutput && (
                                             <div><h3 className="font-semibold mb-2">Execution Output:</h3><pre className="bg-background p-4 rounded-md overflow-x-auto text-sm font-code">{runnerResult.executionOutput}</pre></div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {runnerResult.success ? (
                                            <div><h3 className="font-semibold mb-2">Execution Output:</h3><pre className="bg-background p-4 rounded-md overflow-x-auto text-sm font-code">{runnerResult.executionOutput || 'No output produced.'}</pre></div>
                                        ) : (
                                            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Execution Failed</AlertTitle><AlertDescription className="font-code whitespace-pre-wrap">{runnerResult.errorOutput}</AlertDescription></Alert>
                                        )}
                                    </>
                                )}
                            </div>
                        ): (
                            <div className="flex items-center justify-center h-full text-muted-foreground"><p>Click "Run" to see the output.</p></div>
                        )}
                    </TabsContent>
                    <TabsContent value="history" className="flex-1 bg-muted/50 rounded-b-lg overflow-y-auto m-0">
                        <RunHistory history={runHistory} onRestore={(code) => handleSingleFileChange(code)} onClear={handleClearHistory} />
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    )
  }

  const renderEditor = () => {
    switch (selectedLanguage) {
        case 'c':
        case 'python':
        case 'java':
        case 'typescript':
        case 'ruby':
        case 'r':
            return renderBackendRunner();
        default: // 'frontend', 'html', 'css', 'javascript'
            const isWebPreviewable = ['frontend', 'html'].includes(selectedLanguage);
            return (
              <div className={cn("grid grid-cols-1 gap-4 md:h-[calc(100vh-10rem)]", isPreviewVisible && isWebPreviewable && "md:grid-cols-2")}>
                  <Card className="flex flex-col h-[60vh] md:h-full">
                    {selectedLanguage === 'frontend' ? (
                      <Tabs defaultValue="html" className="flex-1 flex flex-col" onValueChange={(val) => setActiveTab(val as FileType)}>
                        <CardHeader className="flex-row items-center justify-between">
                            <div className="flex flex-col gap-1.5"><CardTitle>Editor</CardTitle><CardDescription>Multi-file editor for web projects.</CardDescription></div>
                          <TabsList><TabsTrigger value="html">index.html</TabsTrigger><TabsTrigger value="css">style.css</TabsTrigger><TabsTrigger value="javascript">script.js</TabsTrigger></TabsList>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                          <TabsContent value="html" className="flex-1 m-0">{renderMonacoEditor('html', codes.frontend.html, (val) => handleCodeChange('html', val))}</TabsContent>
                          <TabsContent value="css" className="flex-1 m-0">{renderMonacoEditor('css', codes.frontend.css, (val) => handleCodeChange('css', val))}</TabsContent>
                          <TabsContent value="javascript" className="flex-1 m-0">{renderMonacoEditor('javascript', codes.frontend.javascript, (val) => handleCodeChange('javascript', val))}</TabsContent>
                        </CardContent>
                      </Tabs>
                    ) : (
                      <>
                        <CardHeader><CardTitle>{selectedLanguage.toUpperCase()} Editor</CardTitle><CardDescription>Live preview for HTML-based projects.</CardDescription></CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                          {renderMonacoEditor(selectedLanguage, codes[selectedLanguage as Exclude<Language, 'frontend' | 'c' | 'python' | 'java' | 'typescript' | 'ruby' | 'r'>], handleSingleFileChange)}
                        </CardContent>
                      </>
                    )}
          
                    <CardFooter className="flex flex-wrap gap-2 justify-between">
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
                                          <p className="p-4 text-sm text-center text-muted-foreground">Click the button to generate a suggestion.</p>
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
                                <TooltipTrigger asChild><Button variant="outline" onClick={handleShareToForum}><Share2 className="mr-2 h-4 w-4" /> Share</Button></TooltipTrigger>
                                <TooltipContent><p>Share to Forum</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  {isWebPreviewable && isPreviewVisible && (
                      <Card className="flex flex-col h-[60vh] md:h-full">
                      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Preview</CardTitle><Button variant="ghost" size="icon" onClick={() => setIsPreviewVisible(false)}><ChevronDown className="h-4 w-4" /></Button></CardHeader>
                      <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden"><iframe srcDoc={previewDoc} title="Preview" sandbox="allow-scripts" className="w-full h-full border-0 bg-white" /></CardContent>
                      </Card>
                  )}
          
                  {isWebPreviewable && !isPreviewVisible && (
                      <div className="absolute top-0 right-4">
                           <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setIsPreviewVisible(true)}><ChevronUp className="h-4 w-4" /></Button></TooltipTrigger>
                                  <TooltipContent><p>Show Preview</p></TooltipContent>
                              </Tooltip>
                           </TooltipProvider>
                      </div>
                  )}
                </div>
              );
    }
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <h1 className="text-2xl font-bold font-headline">Code Playground</h1>
            <div className="sm:ml-auto w-full sm:w-64">
                <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val as Language)}>
                    <SelectTrigger><SelectValue placeholder="Select a language/mode" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="frontend">Frontend (HTML/CSS/JS)</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="css">CSS</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="c">C Language</SelectItem>
                        <SelectItem value="ruby">Ruby</SelectItem>
                        <SelectItem value="r">R</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {renderEditor()}

        {/* Dialogs and Alerts */}
        <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Save Snippet</DialogTitle><DialogDescription>{user ? "Your snippet will be saved to your account." : "You are not logged in. Snippets will be saved to this browser only."}</DialogDescription></DialogHeader>
            <Input value={snippetName} onChange={(e) => setSnippetName(e.target.value)} placeholder="Enter snippet name" />
            <DialogFooter><Button onClick={() => setIsSaveOpen(false)} variant="outline">Cancel</Button><Button onClick={handleSaveSnippet} disabled={isActionLoading}>{isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Load Snippet</DialogTitle><DialogDescription>Showing snippets for {user ? user.email : 'this browser'}</DialogDescription></DialogHeader>
            <ScrollArea className="h-72 -mx-6">
              {isActionLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="flex flex-col gap-2 px-6">
                  {snippets.length > 0 ? (
                    snippets.map((s) => (
                      <div key={s.id} className="group flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
                        <button onClick={() => handleLoadSnippet(s)} className="text-left flex-1">
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.language.toUpperCase()} - {new Date(s.createdAt as string).toLocaleDateString()}</p>
                        </button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSnippet(s.id)} disabled={isActionLoading}>{isActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}</Button></TooltipTrigger>
                             <TooltipContent><p>Delete Snippet</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No saved snippets.</p>
                  )}
                </div>
              )}
            </ScrollArea>
             <DialogFooter><Button onClick={() => setIsLoadOpen(false)} variant="outline">Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAiGenerateOpen} onOpenChange={setIsAiGenerateOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Generate Code with AI</DialogTitle><DialogDescription>Describe the code you want to generate. Be as specific as possible. The generated code will replace the content in the currently active editor tab.</DialogDescription></DialogHeader>
                <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., 'a login form with email and password fields' or 'a function that reverses a string'" rows={4}/>
                <DialogFooter><Button onClick={() => setIsAiGenerateOpen(false)} variant="outline">Cancel</Button><Button onClick={handleGenerateCode} disabled={isGenerating}>{isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate"}</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDebugAlertOpen} onOpenChange={setIsDebugAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>AI Debugging Assistant</AlertDialogTitle><AlertDialogDescription asChild><ScrollArea className="h-72 pr-4"><div className="whitespace-pre-wrap font-sans text-sm">{debugResult}</div></ScrollArea></AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogAction>Got it!</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
