
"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { runPythonCode } from '@/ai/flows/run-python';
import { suggestCode } from '@/ai/flows/suggest-code';
import { Play, Loader2, AlertTriangle, CheckCircle, Lightbulb, CornerDownLeft, History } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { useSettings } from './settings';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { playKeystrokeSound } from '@/lib/sounds';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RunHistory, { type HistoryEntry } from './run-history';

interface RunResult {
    errorOutput?: string;
    success: boolean;
    executionOutput?: string;
}

interface PythonRunnerProps {
    code: string;
    setCode: (code: string) => void;
}

const LOCAL_STORAGE_KEY_PREFIX = 'codeleap-run-history-';

export default function PythonRunner({ code, setCode }: PythonRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [runHistory, setRunHistory] = useState<HistoryEntry[]>([]);
  const { toast } = useToast();
  const { isAiSuggestionsEnabled, editorFontSize, tabSize, autoBrackets, isTypingSoundEnabled } = useSettings();
  const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}python`;

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        setRunHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
        console.error("Could not load run history from local storage:", error);
    }
  }, [storageKey]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isTypingSoundEnabled) {
        playKeystrokeSound();
    }
    setCode(e.target.value);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const { selectionStart, value } = target;
    
    if (autoBrackets) {
        const bracketPairs: { [key: string]: string } = { '(': ')', '{': '}', '[': ']', '<': '>' };
        const key = e.key as keyof typeof bracketPairs;

        if (key in bracketPairs) {
          e.preventDefault();
          const closingBracket = bracketPairs[key];
          const newValue = value.substring(0, selectionStart) + key + closingBracket + value.substring(selectionStart);
          setCode(newValue);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = selectionStart + 1;
          }, 0);
          return;
        }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const tabSpaces = ' '.repeat(tabSize);
      const newValue = value.substring(0, selectionStart) + tabSpaces + value.substring(target.selectionEnd);
      setCode(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = selectionStart + tabSpaces.length;
      }, 0);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const output = await runPythonCode({ code });
      setResult(output);
      
      // Add to history
      const newHistoryEntry: HistoryEntry = {
        id: new Date().toISOString(),
        code,
        result: output,
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [newHistoryEntry, ...runHistory].slice(0, 50); // Keep last 50 runs
      setRunHistory(updatedHistory);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while running the code.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSuggestCode = async () => {
    setIsSuggesting(true);
    setSuggestion('');
    try {
      const result = await suggestCode({ code, language: 'python' });
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to get suggestion.' });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleInsertSuggestion = () => {
    setCode(code + suggestion);
    setSuggestion('');
  };
  
  const handleClearHistory = () => {
    setRunHistory([]);
    localStorage.removeItem(storageKey);
    toast({ description: "Run history cleared." });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[calc(100vh-10rem)]">
        <Card className="flex flex-col h-[60vh] md:h-full">
            <CardHeader>
                <CardTitle>Python Language Editor</CardTitle>
                <CardDescription>Write and run Python code. The AI will simulate execution.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                 <Textarea
                    value={code}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "flex-1 font-code bg-muted/50 resize-none h-full",
                        editorFontSize === 'small' && 'text-xs',
                        editorFontSize === 'medium' && 'text-sm',
                        editorFontSize === 'large' && 'text-base'
                    )}
                    placeholder="Write your Python code here..."
                />
            </CardContent>
            <CardFooter className="flex justify-between">
                 <div className="flex gap-2">
                    <Button onClick={handleRun} disabled={isRunning} className="bg-primary hover:bg-primary/90">
                        {isRunning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" /> Run
                            </>
                        )}
                    </Button>
                     {isAiSuggestionsEnabled && (
                      <Popover onOpenChange={(open) => { if(!open) setSuggestion('')}}>
                        <PopoverTrigger asChild>
                           <Button variant="outline" onClick={handleSuggestCode} disabled={isSuggesting} size="icon" aria-label="Get AI suggestion">
                                {isSuggesting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Lightbulb className="h-4 w-4" />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            {isSuggesting ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading suggestion...
                                </div>
                            ) : suggestion ? (
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">AI Suggestion</h4>
                                    <p className="text-sm text-muted-foreground">
                                      The AI suggests the following code.
                                    </p>
                                  </div>
                                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-sm font-code">{suggestion}</pre>
                                  <Button onClick={handleInsertSuggestion} size="sm">
                                    <CornerDownLeft className="mr-2 h-4 w-4" /> Insert
                                  </Button>
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
                        <TabsTrigger value="history">
                            <History className="mr-2 h-4 w-4" /> Run History ({runHistory.length})
                        </TabsTrigger>
                    </TabsList>
                </CardHeader>
                 <TabsContent value="output" className="flex-1 bg-muted/50 rounded-b-lg overflow-y-auto p-4 m-0">
                    {isRunning ? (
                        <div className="flex items-center justify-center h-full">
                             <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                             <p>Running code...</p>
                        </div>
                    ): result ? (
                        <div className="flex flex-col gap-4">
                            {result.success ? (
                                <div>
                                    <h3 className="font-semibold mb-2">Execution Output:</h3>
                                    <pre className="bg-background p-4 rounded-md overflow-x-auto text-sm font-code">{result.executionOutput || 'No output produced.'}</pre>
                                 </div>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Execution Failed</AlertTitle>
                                    <AlertDescription className="font-code whitespace-pre-wrap">{result.errorOutput}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ): (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Click "Run" to see the output.</p>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="history" className="flex-1 bg-muted/50 rounded-b-lg overflow-y-auto m-0">
                    <RunHistory
                        history={runHistory}
                        onRestore={(code) => setCode(code)}
                        onClear={handleClearHistory}
                    />
                </TabsContent>
            </Tabs>
        </Card>
    </div>
  );
}
