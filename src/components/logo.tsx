
"use client"

import { Code2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="CodeLeap brand">
      <Code2 className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-foreground font-headline group-data-[collapsible=icon]:hidden">CodeLeap</h1>
    </div>
  );
}
