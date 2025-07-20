
"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { runJavaCode } from '@/ai/flows/run-java';
import { Play, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const defaultCode = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java World!");
    }
}`;

interface RunResult {
    compilationOutput: string;
    success: boolean;
    executionOutput?: string;
}

export default function JavaRunner() {
  const [code, setCode] = useState(defaultCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const { toast } = useToast();

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

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const output = await runJavaCode({ code });
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while running the code.' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-[calc(100vh-10rem)]">
        <Card className="flex flex-col h-[60vh] md:h-full">
            <CardHeader>
                <CardTitle>Java Language Editor</CardTitle>
                <CardDescription>Write and run Java code. The AI will simulate compilation and execution.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                 <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 font-code text-sm bg-muted/50 resize-none h-full"
                    placeholder="Write your Java code here..."
                />
            </CardContent>
            <CardFooter>
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
            </CardFooter>
        </Card>
        <Card className="flex flex-col h-[60vh] md:h-full">
            <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>View compilation and execution results here.</CardDescription>
            </CardHeader>
             <CardContent className="flex-1 bg-muted/50 rounded-b-lg overflow-hidden p-4">
                {isRunning ? (
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
                        <p>Click "Run" to see the output.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
