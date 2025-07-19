
"use client"

import { Code2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function Logo({ onClick, className, isButton = true }: { onClick?: () => void, className?: string, isButton?: boolean }) {
  const Comp = isButton ? Button : 'div';
  const props = isButton ? { variant: "ghost", onClick } : {};

  return (
    <Comp 
      {...props}
      className={cn(
        "flex items-center gap-2 justify-start w-full h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        isButton && "hover:bg-transparent",
        className
      )}
      aria-label={isButton ? "Toggle Sidebar" : "CodeLeap Logo"}
    >
      <Code2 className="h-7 w-7 text-primary shrink-0" />
      <h1 className="text-xl font-bold text-foreground font-headline group-data-[collapsible=icon]:hidden">{isButton ? 'CodeLeap' : ''}</h1>
       {!isButton && <h1 className="text-xl font-bold text-foreground font-headline">CodeLeap</h1>}
    </Comp>
  );
}
