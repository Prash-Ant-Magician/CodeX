
"use client"

import { Code2 } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';

export function Logo() {
  const { toggleSidebar, isMobile } = useSidebar();

  const Wrapper = isMobile ? 'button' : Link;
  const wrapperProps = isMobile ? { onClick: toggleSidebar } : { href: '/' };

  return (
    <Wrapper {...wrapperProps} className="flex items-center gap-2" aria-label={isMobile ? "Toggle sidebar" : "Go to dashboard"}>
      <Code2 className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-foreground font-headline">CodeLeap</h1>
    </Wrapper>
  );
}

    