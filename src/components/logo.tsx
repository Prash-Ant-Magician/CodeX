
"use client"

import { Braces } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 justify-start",
        "group-data-[collapsible=icon]/sidebar-wrapper:justify-center",
        className
      )}
    >
      <Braces className="h-7 w-7 text-primary shrink-0" />
      <h1 className="text-xl font-bold text-foreground font-headline group-data-[collapsible=icon]/sidebar-wrapper:hidden">CodeLeap</h1>
    </div>
  );
}
