
"use client"

import { Braces } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function Logo({ onClick, className }: { onClick?: () => void, className?: string }) {

  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 justify-start w-full h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent",
        className
      )}
      aria-label="Toggle Sidebar"
    >
      <Braces className="h-7 w-7 text-primary shrink-0" />
      <h1 className="text-xl font-bold text-foreground font-headline group-data-[collapsible=icon]/sidebar-wrapper:hidden">CodeLeap</h1>
    </Button>
  );
}
