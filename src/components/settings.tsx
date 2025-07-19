
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

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
    </div>
  );
}
