
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, Clock, Code2, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface HistoryEntry {
    id: string;
    code: string;
    result: {
        success: boolean;
        output: string;
    };
    timestamp: string;
}

interface RunHistoryProps {
    history: HistoryEntry[];
    onRestore: (code: string) => void;
}

export default function RunHistory({ history, onRestore }: RunHistoryProps) {
  const { toast } = useToast();

  const handleRestoreClick = (code: string) => {
    onRestore(code);
    toast({
      description: "Code has been restored to the editor.",
    });
  };

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-4">
        <p className="text-muted-foreground">No run history yet. Click "Run" to start recording your executions.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
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
                    {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Card>
                <CardHeader>
                   <div className="flex justify-between items-center">
                     <CardTitle className="text-base flex items-center"><Code2 className="mr-2 h-5 w-5"/> Code Snapshot</CardTitle>
                     <Button size="sm" variant="secondary" onClick={() => handleRestoreClick(entry.code)}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Restore
                     </Button>
                   </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                    <code>{entry.code}</code>
                  </pre>
                </CardContent>
                <CardFooter>
                    <Alert variant={entry.result.success ? 'default' : 'destructive'} className={entry.result.success ? 'border-green-500/50 text-green-500' : ''}>
                        <AlertTitle>{entry.result.success ? 'Output' : 'Error'}</AlertTitle>
                        <AlertDescription className="font-mono whitespace-pre-wrap">{entry.result.output}</AlertDescription>
                    </Alert>
                </CardFooter>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}
