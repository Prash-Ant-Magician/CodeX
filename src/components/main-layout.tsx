
"use client";

import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Code, BookOpen, Trophy, MessageSquare, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import CodeEditor from '@/components/code-editor';
import LearningModules from '@/components/learning-modules';
import CodingChallenges from '@/components/coding-challenges';
import FeedbackForm from '@/components/feedback-form';
import { Toaster } from './ui/toaster';
import { useAuth, signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ActiveView = 'editor' | 'learn' | 'challenges' | 'feedback';

function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to sign out." });
    }
  };

  if (!user) {
    return (
       <Button onClick={() => router.push('/login')} variant="outline">
        Login
      </Button>
    );
  }

  const getInitials = (email: string) => {
    const parts = email.split('@');
    return parts[0][0].toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.email ? getInitials(user.email) : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || user.phoneNumber}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarHeaderContent() {
    const { toggleSidebar } = useSidebar();
    return (
        <SidebarHeader>
            <Logo onClick={toggleSidebar} />
        </SidebarHeader>
    );
}

function MainHeaderContent() {
  const { state } = useSidebar();
  return (
     <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
         {/* Mobile Trigger */}
        <SidebarTrigger className="sm:hidden" />

        {/* Desktop Trigger (visible when collapsed) */}
        {state === 'collapsed' && (
          <div className="hidden sm:flex items-center gap-2">
            <SidebarTrigger />
            <Logo isButton={false} />
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
          <UserNav />
      </div>
    </header>
  );
}

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
      case 'feedback':
        return <FeedbackForm />;
      default:
        return <CodeEditor />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeaderContent />
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
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('feedback')}
                isActive={activeView === 'feedback'}
                tooltip="Feedback"
              >
                <MessageSquare />
                <span>Feedback</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <MainHeaderContent />
        <div className="p-4 md:p-6">{renderContent()}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
