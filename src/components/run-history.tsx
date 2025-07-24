
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Clock, Code2, RefreshCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export interface HistoryEntry {
    id: string;
    code: string;
    result: {
        success: boolean;
        executionOutput?: string;
        compilationOutput?: string;
        errorOutput?: string;
    };
    timestamp: string;
}

interface RunHistoryProps {
    history: HistoryEntry[];
    onRestore: (code: string) => void;
    onClear: () => void;
}

export default function RunHistory({ history, onRestore, onClear }: RunHistoryProps) {
  const { toast } = useToast();

  const handleRestoreClick = (code: string) => {
    onRestore(code);
    toast({
      description: "Code has been restored to the editor.",
    });
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-muted-foreground">No run history yet.</p>
        <p className="text-sm text-muted-foreground">Click the "Run" button to start recording your executions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="p-4 border-b border-border">
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
       </div>
       <ScrollArea className="flex-1">
         <Accordion type="single" collapsible className="w-full">
            {history.map((entry) => (
              <AccordionItem value={entry.id} key={entry.id}>
                <AccordionTrigger className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {entry.result.success ? (
                       <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                       <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">Run {entry.result.success ? 'Succeeded' : 'Failed'}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                        <Clock className="inline-block h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <Card className="bg-background">
                    <CardHeader>
                       <div className="flex justify-between items-center">
                         <CardTitle className="text-base flex items-center"><Code2 className="mr-2 h-5 w-5"/> Code Snapshot</CardTitle>
                         <Button size="sm" variant="secondary" onClick={() => handleRestoreClick(entry.code)}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> Restore
                         </Button>
                       </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-2 rounded-md text-xs font-code overflow-x-auto">
                        <code>{entry.code}</code>
                      </pre>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2">
                      <h4 className="font-semibold text-sm">Result:</h4>
                      {entry.result.success ? (
                        <div className="w-full">
                            {entry.result.compilationOutput && entry.result.compilationOutput !== 'Compilation successful' && (
                                <Alert className="border-green-500/50 text-green-500 mb-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Compilation Output</AlertTitle>
                                    <AlertDescription className="font-code whitespace-pre-wrap">{entry.result.compilationOutput}</AlertDescription>
                                </Alert>
                            )}
                             <pre className="bg-muted p-2 rounded-md text-xs font-code overflow-x-auto w-full">{entry.result.executionOutput || 'No output produced.'}</pre>
                        </div>
                      ) : (
                         <Alert variant="destructive" className="w-full">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription className="font-code whitespace-pre-wrap">{entry.result.errorOutput || entry.result.compilationOutput}</AlertDescription>
                        </Alert>
                      )}
                    </CardFooter>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
         </Accordion>
       </ScrollArea>
    </div>
  );
}
