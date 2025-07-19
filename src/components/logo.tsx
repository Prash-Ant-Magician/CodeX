"use client"

import { Code2 } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export function Logo() {
  const { toggleSidebar } = useSidebar();

  return (
    <button onClick={toggleSidebar} className="flex items-center gap-2" aria-label="Toggle sidebar">
      <Code2 className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-foreground font-headline">CodeLeap</h1>
    </button>
  );
}
