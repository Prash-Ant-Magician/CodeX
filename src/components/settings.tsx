
"use client";

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';

// 1. Create a Context for settings
interface SettingsContextType {
  isAiSuggestionsEnabled: boolean;
  setIsAiSuggestionsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 2. Create a Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isAiSuggestionsEnabled, setIsAiSuggestionsEnabled] = useState(false);

  return (
    <SettingsContext.Provider value={{ isAiSuggestionsEnabled, setIsAiSuggestionsEnabled }}>
      {children}
    </SettingsContext.Provider>
  );
}

// 3. Create a custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  // 4. Use the context to manage state
  const { isAiSuggestionsEnabled, setIsAiSuggestionsEnabled } = useSettings();

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
                <Label htmlFor="theme" className="text-base">Theme</Label>
                <p className="text-sm text-muted-foreground">Select the theme for the application.</p>
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
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>Manage settings related to the code editor.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid gap-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
