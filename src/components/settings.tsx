
"use client";

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type EditorFontSize = 'small' | 'medium' | 'large';
type EditorTheme = 'vs-dark' | 'light';

interface SettingsContextType {
  isAiSuggestionsEnabled: boolean;
  setIsAiSuggestionsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  editorFontSize: EditorFontSize;
  setEditorFontSize: React.Dispatch<React.SetStateAction<EditorFontSize>>;
  tabSize: number;
  setTabSize: React.Dispatch<React.SetStateAction<number>>;
  autoBrackets: boolean;
  setAutoBrackets: React.Dispatch<React.SetStateAction<boolean>>;
  isTypingSoundEnabled: boolean;
  setIsTypingSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  editorTheme: EditorTheme;
  setEditorTheme: React.Dispatch<React.SetStateAction<EditorTheme>>;
  isSyntaxHighlightingEnabled: boolean;
  setIsSyntaxHighlightingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isAiSuggestionsEnabled, setIsAiSuggestionsEnabled] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState<EditorFontSize>('medium');
  const [tabSize, setTabSize] = useState(2);
  const [autoBrackets, setAutoBrackets] = useState(true);
  const [isTypingSoundEnabled, setIsTypingSoundEnabled] = useState(false);
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('vs-dark');
  const [isSyntaxHighlightingEnabled, setIsSyntaxHighlightingEnabled] = useState(true);


  return (
    <SettingsContext.Provider 
      value={{ 
        isAiSuggestionsEnabled, setIsAiSuggestionsEnabled,
        editorFontSize, setEditorFontSize,
        tabSize, setTabSize,
        autoBrackets, setAutoBrackets,
        isTypingSoundEnabled, setIsTypingSoundEnabled,
        editorTheme, setEditorTheme,
        isSyntaxHighlightingEnabled, setIsSyntaxHighlightingEnabled
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { 
    isAiSuggestionsEnabled, setIsAiSuggestionsEnabled,
    editorFontSize, setEditorFontSize,
    tabSize, setTabSize,
    autoBrackets, setAutoBrackets,
    isTypingSoundEnabled, setIsTypingSoundEnabled,
    editorTheme, setEditorTheme,
    isSyntaxHighlightingEnabled, setIsSyntaxHighlightingEnabled
  } = useSettings();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="theme" className="text-base">App Theme</Label>
                <p className="text-sm text-muted-foreground">Select the theme for the application UI.</p>
              </div>
              <RadioGroup
                aria-label="Theme"
                name="theme"
                value={theme}
                onValueChange={setTheme}
                className="flex items-center gap-4"
              >
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="light" id="light" />
                  Light
                </Label>
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="dark" id="dark" />
                  Dark
                </Label>
                <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="system" id="system" />
                  System
                </Label>
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="editor-theme" className="text-base">Editor Theme</Label>
                <p className="text-sm text-muted-foreground">Select the theme for the code editor.</p>
              </div>
               <Select value={editorTheme} onValueChange={(value) => setEditorTheme(value as EditorTheme)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vs-dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>Manage settings related to the code editor.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="syntax-highlighting" className="text-base">Syntax Highlighting</Label>
                <p className="text-sm text-muted-foreground">
                    Enable or disable language-specific color highlighting in the editor.
                </p>
              </div>
               <Switch
                id="syntax-highlighting"
                checked={isSyntaxHighlightingEnabled}
                onCheckedChange={setIsSyntaxHighlightingEnabled}
                aria-label="Toggle syntax highlighting"
              />
            </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="ai-suggestions" className="text-base">AI Code Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                    Enable or disable AI-powered autocomplete and suggestions while you code.
                </p>
              </div>
               <Switch
                id="ai-suggestions"
                checked={isAiSuggestionsEnabled}
                onCheckedChange={setIsAiSuggestionsEnabled}
                aria-label="Toggle AI code suggestions"
              />
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="typing-sounds" className="text-base">Keystroke Sounds</Label>
                <p className="text-sm text-muted-foreground">
                    Play a sound on each keystroke for a retro vibe.
                </p>
              </div>
               <Switch
                id="typing-sounds"
                checked={isTypingSoundEnabled}
                onCheckedChange={setIsTypingSoundEnabled}
                aria-label="Toggle keystroke sounds"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="font-size" className="text-base">Font Size</Label>
                <p className="text-sm text-muted-foreground">Adjust the font size of the code editor.</p>
              </div>
              <RadioGroup
                aria-label="Font Size"
                name="font-size"
                value={editorFontSize}
                onValueChange={(value) => setEditorFontSize(value as EditorFontSize)}
                className="flex items-center gap-4"
              >
                <Label htmlFor="font-small" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="small" id="font-small" />
                  Small
                </Label>
                <Label htmlFor="font-medium" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="medium" id="font-medium" />
                  Medium
                </Label>
                <Label htmlFor="font-large" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="large" id="font-large" />
                  Large
                </Label>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="tab-size" className="text-base">Tab Size</Label>
                <p className="text-sm text-muted-foreground">Set the number of spaces for a tab character.</p>
              </div>
              <RadioGroup
                aria-label="Tab Size"
                name="tab-size"
                value={String(tabSize)}
                onValueChange={(value) => setTabSize(Number(value))}
                className="flex items-center gap-4"
              >
                <Label htmlFor="tab-2" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="2" id="tab-2" />
                  2
                </Label>
                <Label htmlFor="tab-4" className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="4" id="tab-4" />
                  4
                </Label>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-brackets" className="text-base">Auto Close Brackets</Label>
                <p className="text-sm text-muted-foreground">
                    Automatically insert closing brackets when an opening bracket is typed.
                </p>
              </div>
               <Switch
                id="auto-brackets"
                checked={autoBrackets}
                onCheckedChange={setAutoBrackets}
                aria-label="Toggle automatic bracket closing"
              />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
