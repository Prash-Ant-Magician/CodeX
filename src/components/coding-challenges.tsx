
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, XCircle, Terminal } from 'lucide-react';

const challenges = [
  {
    id: 'sum-array',
    title: 'Sum of Array',
    description: 'Write a function that takes an array of numbers and returns their sum.',
    template: `function sumArray(arr) {\n  // Your code here\n}`,
    language: 'javascript',
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    description: 'Write a function that takes a string and returns it in reverse.',
    template: `function reverseString(str) {\n  // Your code here\n}`,
    language: 'javascript',
  },
  {
    id: 'palindrome',
    title: 'Palindrome Checker',
    description: 'Write a function that checks if a given string is a palindrome (reads the same forwards and backward).',
    template: `function isPalindrome(str) {\n  // Your code here\n}`,
    language: 'javascript',
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    description: 'Write a function that prints numbers from 1 to 100. For multiples of 3, print "Fizz". For multiples of 5, print "Buzz". For multiples of both 3 and 5, print "FizzBuzz".',
    template: `function fizzBuzz() {\n  // Your code here\n}`,
    language: 'javascript',
  },
  {
    id: 'max-number',
    title: 'Find Max Number',
    description: 'Write a function that takes an array of numbers and returns the largest number.',
    template: `function findMax(arr) {\n  // Your code here\n}`,
    language: 'javascript',
  },
  {
    id: 'html-form',
    title: 'Simple HTML Form',
    description: 'Create an HTML form with a text input for a name, an email input, and a submit button.',
    template: `<!-- Your HTML form here -->`,
    language: 'html',
  },
  {
    id: 'css-button-style',
    title: 'Style a Button',
    description: 'Write CSS to style a button with a blue background, white text, and a light-blue background on hover.',
    template: `button {\n  /* Your CSS here */\n}`,
    language: 'css',
  },
  {
    id: 'center-div',
    title: 'Center a Div',
    description: 'Write CSS using Flexbox to center a div both horizontally and vertically inside its parent container.',
    template: `.parent {\n  display: flex;\n  /* Your CSS here */\n}\n\n.child {\n  width: 100px;\n  height: 100px;\n}`,
    language: 'css',
  },
   {
    id: 'remove-duplicates',
    title: 'Remove Duplicates from Array',
    description: 'Write a function that takes an array and returns a new array with duplicates removed.',
    template: `function removeDuplicates(arr) {\n  // Your code here\n}`,
    language: 'javascript',
  },
  {
    id: 'html-list',
    title: 'Create an Ordered List',
    description: 'Create an ordered list in HTML with three list items: "First", "Second", "Third".',
    template: `<!-- Your HTML list here -->`,
    language: 'html',
  },
];

type TestResult = {
  status: 'success' | 'failure';
  message: string;
} | null;

export default function CodingChallenges() {
  const [activeChallengeId, setActiveChallengeId] = useState(challenges[0].id);
  const activeChallenge = challenges.find((c) => c.id === activeChallengeId)!;
  const [code, setCode] = useState(activeChallenge.template);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleChallengeChange = (id: string) => {
    const newChallenge = challenges.find((c) => c.id === id)!;
    setActiveChallengeId(id);
    setCode(newChallenge.template);
    setTestResult(null);
  };

  const handleRunTests = () => {
    setIsRunning(true);
    setTestResult(null);
    setTimeout(() => {
      const success = Math.random() > 0.5;
      if (success) {
        setTestResult({ status: 'success', message: 'All tests passed! Great job!' });
      } else {
        setTestResult({ status: 'failure', message: 'Test failed. Hint: Check for edge cases.' });
      }
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Coding Challenges</h1>
        <p className="text-muted-foreground">Test your skills with our coding challenges.</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Select Challenge:</span>
        <Select value={activeChallengeId} onValueChange={handleChallengeChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a challenge" />
          </SelectTrigger>
          <SelectContent>
            {challenges.map((challenge) => (
              <SelectItem key={challenge.id} value={challenge.id}>
                {challenge.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeChallenge.title}</CardTitle>
          <CardDescription>{activeChallenge.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-code h-64 bg-muted/50"
            placeholder="Enter your solution here..."
          />
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <Button onClick={handleRunTests} disabled={isRunning} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
          {testResult && (
            <Alert variant={testResult.status === 'success' ? 'default' : 'destructive'} className={testResult.status === 'success' ? 'border-green-500/50 text-green-500' : ''}>
              {testResult.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>{testResult.status === 'success' ? 'Success!' : 'Failed'}</AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
