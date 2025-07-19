
"use client";

import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Code, BookOpen, Trophy } from 'lucide-react';
import { Logo } from '@/components/logo';
import CodeEditor from '@/components/code-editor';
import LearningModules from '@/components/learning-modules';
import CodingChallenges from '@/components/coding-challenges';
import { Toaster } from './ui/toaster';

type ActiveView = 'editor' | 'learn' | 'challenges';

export function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('editor');

  const renderContent = () => {
    switch (activeView) {
      case 'editor':
        return <CodeEditor />;
      case 'learn':
        return <LearningModules />;
      case 'challenges':
        return <CodingChallenges />;
      default:
        return <CodeEditor />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('editor')}
                isActive={activeView === 'editor'}
                tooltip="Code Editor"
              >
                <Code />
                <span>Code Editor</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('learn')}
                isActive={activeView === 'learn'}
                tooltip="Learning Modules"
              >
                <BookOpen />
                <span>Learn</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('challenges')}
                isActive={activeView === 'challenges'}
                tooltip="Coding Challenges"
              >
                <Trophy />
                <span>Challenges</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
          <Logo />
        </header>
        <div className="p-4 md:p-6">{renderContent()}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
