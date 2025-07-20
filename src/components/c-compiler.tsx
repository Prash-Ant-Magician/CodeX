
"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { compileCode } from '@/ai/flows/compile-code';
import { suggestCode } from '@/ai/flows/suggest-code';
import { Play, Loader2, AlertTriangle, CheckCircle, Lightbulb, CornerDownLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { useSettings } from './settings';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const defaultCode = `#include <stdio.h>

int main() {
    printf("Hello, C World!\\n");
    return 0;
}`;

interface CompilationResult {
    compilationOutput: string;
    success: boolean;
    executionOutput?: string;
}

export default function CCompiler() {
  const [code, setCode] = useState(defaultCode);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [result, setResult] = useState<CompilationResult | null>(null);
  const { toast } = useToast();
  const { isAiSuggestionsEnabled } = useSettings();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const { selectionStart, value } = target;
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + '  ' + value.substring(target.selectionEnd);
      setCode(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 2;
      }, 0);
    }
  };

  const handleCompileAndRun = async () => {
    setIsCompiling(true);
    setResult(null);
    try {
      const output = await compileCode({ code });
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while compiling.' });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSuggestCode = async () => {
    setIsSuggesting(true);
    setSuggestion('');
    try {
      const result = await suggestCode({ code, language: 'c' });
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to get suggestion.' });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleInsertSuggestion = () => {
    setCode(prev => prev + suggestion);
    setSuggestion('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[calc(100vh-10rem)]">
        <Card className="flex flex-col h-[60vh] md:h-full">
            <CardHeader>
                <CardTitle>C Language Editor</CardTitle>
                <CardDescription>Write and compile C code. The AI will simulate compilation and execution.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                 <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 font-code text-sm bg-muted/50 resize-none h-full"
                    placeholder="Write your C code here..."
                />
            </CardContent>
            <CardFooter className="flex justify-between">
                 <div className="flex gap-2">
                    <Button onClick={handleCompileAndRun} disabled={isCompiling} className="bg-primary hover:bg-primary/90">
                        {isCompiling ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Compiling...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" /> Compile & Run
                            </>
                        )}
                    </Button>
                    {isAiSuggestionsEnabled && (
                      <Popover onOpenChange={(open) => !open && setSuggestion('')}>
                        <PopoverTrigger asChild>
                           <Button variant="outline" onClick={handleSuggestCode} disabled={isSuggesting}>
                                {isSuggesting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Lightbulb className="mr-2 h-4 w-4" />
                                )}
                                Get Suggestion
                            </Button>
                        </PopoverTrigger>
                        {suggestion && !isSuggesting && (
                          <PopoverContent className="w-80">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">Suggestion</h4>
                                <p className="text-sm text-muted-foreground">
                                  Here's a suggestion from the AI.
                                </p>
                              </div>
                              <pre className="bg-muted p-2 rounded-md overflow-x-auto text-sm font-code">{suggestion}</pre>
                              <Button onClick={handleInsertSuggestion} size="sm">
                                <CornerDownLeft className="mr-2 h-4 w-4" /> Insert
                              </Button>
                            </div>
                          </PopoverContent>
                        )}
                      </Popover>
                    )}
                 </div>
            </CardFooter>
        </Card>
        <Card className="flex flex-col h-[60vh] md:h-full">
            <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>View compilation and execution results here.</CardDescription>
            </CardHeader>
             <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden p-4">
                {isCompiling ? (
                    <div className="flex items-center justify-center h-full">
                         <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                         <p>Compiling and running...</p>
                    </div>
                ): result ? (
                    <div className="flex flex-col gap-4">
                        {result.success ? (
                            <Alert className="border-green-500/50 text-green-500">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Compilation Successful</AlertTitle>
                                <AlertDescription className="font-code whitespace-pre-wrap">{result.compilationOutput}</AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Compilation Failed</AlertTitle>
                                <AlertDescription className="font-code whitespace-pre-wrap">{result.compilationOutput}</AlertDescription>
                            </Alert>
                        )}

                        {result.executionOutput && (
                             <div>
                                <h3 className="font-semibold mb-2">Execution Output:</h3>
                                <pre className="bg-background p-4 rounded-md overflow-x-auto text-sm font-code">{result.executionOutput}</pre>
                             </div>
                        )}
                    </div>
                ): (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Click "Compile & Run" to see the output.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
