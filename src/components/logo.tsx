
"use client"

import { Braces } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Braces className="h-7 w-7 text-primary shrink-0" />
      <h1 className="text-xl font-bold text-foreground font-headline">CodeLeap</h1>
    </Link>
  );
}
