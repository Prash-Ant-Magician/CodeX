
"use client"

import { Code2 } from 'lucide-react';
import { Button } from './ui/button';

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className="flex items-center gap-2 justify-start w-full h-auto p-0 hover:bg-transparent"
      aria-label="CodeLeap brand"
    >
      <Code2 className="h-7 w-7 text-primary shrink-0" />
      <h1 className="text-xl font-bold text-foreground font-headline group-data-[collapsible=icon]:hidden">CodeLeap</h1>
    </Button>
  );
}
