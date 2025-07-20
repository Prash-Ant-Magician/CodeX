
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const playSuccessSound = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }
};

const playFailureSound = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }
};

const challenges = [
  // C Challenges
  {
    id: 'c-hello-world',
    title: 'C: Hello, World!',
    description: 'Write a C program that includes the `stdio.h` header and prints "Hello, C!" to the console.',
    template: `#include <stdio.h>\n\nint main() {\n  // Your code here\n  return 0;\n}`,
    language: 'c',
    test: (code: string) => {
      return code.includes('#include <stdio.h>') && code.includes('printf("Hello, C!");');
    },
  },
  {
    id: 'c-sum-variables',
    title: 'C: Sum of Two Numbers',
    description: 'Declare two integer variables, assign them values, and print their sum.',
    template: `#include <stdio.h>\n\nint main() {\n  int a = 5;\n  int b = 10;\n  // Your code here to print the sum\n  return 0;\n}`,
    language: 'c',
    test: (code: string) => {
      return /printf\(".*%d.*",\s*a\s*\+\s*b\s*\)/.test(code.replace(/\s/g, ''));
    },
  },
  {
    id: 'c-for-loop',
    title: 'C: For Loop',
    description: 'Write a C program that uses a `for` loop to print numbers from 1 to 5, each on a new line.',
    template: `#include <stdio.h>\n\nint main() {\n  // Your for loop here\n  return 0;\n}`,
    language: 'c',
    test: (code: string) => {
      return code.includes('for') && /for\s*\(.*int\s+i\s*=\s*1;.*i\s*<=\s*5;.*i\s*\+\+.*\)/.test(code.replace(/\s/g, ''));
    },
  },
  // Python Challenges
  {
    id: 'python-hello-world',
    title: 'Python: Hello, World!',
    description: 'Write a Python script that prints "Hello, Python!" to the console.',
    template: `# Your code here`,
    language: 'python',
    test: (code: string) => {
      return /print\(['"]Hello, Python!['"]\)/.test(code.replace(/\s/g, ''));
    },
  },
  {
    id: 'python-sum-function',
    title: 'Python: Sum Function',
    description: 'Define a function `add` that takes two numbers and returns their sum.',
    template: `def add(a, b):\n  # Your code here`,
    language: 'python',
    test: (code: string) => {
      try {
        const fn = new Function(`${code}\nreturn add;`)();
        return fn(5, 10) === 15 && fn(-1, 1) === 0;
      } catch {
        return false;
      }
    },
  },
  {
    id: 'python-list-comprehension',
    title: 'Python: List of Squares',
    description: 'Use a list comprehension to create a list of the first 5 square numbers (1, 4, 9, 16, 25).',
    template: `squares = [] # Your list comprehension here`,
    language: 'python',
    test: (code: string) => {
      return /\[\s*i\s*\*\*\s*2\s+for\s+i\s+in\s+range\(\s*1\s*,\s*6\s*\)\s*\]/.test(code);
    },
  },
  // Java Challenges
  {
    id: 'java-hello-world',
    title: 'Java: Hello, World!',
    description: 'Write a Java program that prints "Hello, Java!" to the console inside the main method.',
    template: `public class Main {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}`,
    language: 'java',
    test: (code: string) => {
      return /System\.out\.println\(['"]Hello, Java!['"]\);/.test(code.replace(/\s/g, ''));
    },
  },
  {
    id: 'java-sum-variables',
    title: 'Java: Sum of Two Numbers',
    description: 'Declare two integer variables, `a` and `b`, assign them values, and print their sum.',
    template: `public class Main {\n  public static void main(String[] args) {\n    int a = 5;\n    int b = 10;\n    // Your code here to print the sum\n  }\n}`,
    language: 'java',
    test: (code: string) => {
      return /System\.out\.println\(\s*a\s*\+\s*b\s*\);/.test(code.replace(/\s/g, ''));
    },
  },
  {
    id: 'java-string-length',
    title: 'Java: String Length',
    description: 'Create a string variable and print its length to the console.',
    template: `public class Main {\n  public static void main(String[] args) {\n    String myString = "CodeLeap";\n    // Your code here to print the length\n  }\n}`,
    language: 'java',
    test: (code: string) => {
      return /System\.out\.println\(myString\.length\(\)\);/.test(code.replace(/\s/g, ''));
    },
  },
  // JavaScript Challenges
  {
    id: 'sum-array',
    title: 'Sum of Array',
    description: 'Write a function that takes an array of numbers and returns their sum.',
    template: `function sumArray(arr) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn sumArray;`)();
      return fn([1, 2, 3]) === 6 && fn([-1, 0, 1]) === 0 && fn([]) === 0;
    },
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    description: 'Write a function that takes a string and returns it in reverse.',
    template: `function reverseString(str) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn reverseString;`)();
      return fn('hello') === 'olleh' && fn('world') === 'dlrow' && fn('') === '';
    },
  },
  {
    id: 'palindrome',
    title: 'Palindrome Checker',
    description: 'Write a function that checks if a given string is a palindrome (reads the same forwards and backward).',
    template: `function isPalindrome(str) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn isPalindrome;`)();
      return fn('racecar') === true && fn('hello') === false && fn('A man, a plan, a canal: Panama'.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()) === true;
    },
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    description: 'Write a function that returns an array of strings for numbers from 1 to 15. For multiples of 3, use "Fizz". For multiples of 5, use "Buzz". For multiples of both 3 and 5, use "FizzBuzz".',
    template: `function fizzBuzz() {\n  // Your code here, return an array\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn fizzBuzz;`)();
      const result = fn();
      const expected = [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'];
      return Array.isArray(result) && result.length === 15 && result.every((v, i) => v == expected[i]);
    },
  },
  {
    id: 'max-number',
    title: 'Find Max Number',
    description: 'Write a function that takes an array of numbers and returns the largest number.',
    template: `function findMax(arr) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn findMax;`)();
      return fn([1, 5, 2, 9, 3]) === 9 && fn([-1, -5, -2]) === -1;
    },
  },
  {
    id: 'remove-duplicates',
    title: 'Remove Duplicates from Array',
    description: 'Write a function that takes an array and returns a new array with duplicates removed.',
    template: `function removeDuplicates(arr) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn removeDuplicates;`)();
      const result = fn([1, 2, 2, 3, 1, 4]);
      return result.length === 4 && result.includes(1) && result.includes(2) && result.includes(3) && result.includes(4);
    },
  },
  {
    id: 'factorial',
    title: 'Factorial Finder',
    description: 'Write a function that computes the factorial of a non-negative integer.',
    template: `function factorial(n) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn factorial;`)();
      return fn(5) === 120 && fn(0) === 1 && fn(1) === 1;
    },
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Sequence',
    description: 'Write a function to generate the first n numbers in the Fibonacci sequence.',
    template: `function fibonacci(n) {\n  // Your code here, return an array\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn fibonacci;`)();
      const result = fn(8);
      const expected = [0, 1, 1, 2, 3, 5, 8, 13];
      return Array.isArray(result) && result.length === 8 && result.every((v, i) => v === expected[i]);
    },
  },
  {
    id: 'longest-word',
    title: 'Find Longest Word',
    description: 'Write a function that takes a sentence and returns the longest word.',
    template: `function findLongestWord(sentence) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn findLongestWord;`)();
      return fn('The quick brown fox jumped over the lazy dog') === 'jumped';
    },
  },
  {
    id: 'capitalize-words',
    title: 'Capitalize Words',
    description: 'Write a function that capitalizes the first letter of each word in a sentence.',
    template: `function capitalizeWords(sentence) {\n  // Your code here\n}`,
    language: 'javascript',
    test: (code: string) => {
      const fn = new Function(`${code}\nreturn capitalizeWords;`)();
      return fn('hello world from codeleap') === 'Hello World From Codeleap';
    },
  },
  // HTML Challenges
  {
    id: 'html-form',
    title: 'Simple HTML Form',
    description: 'Create an HTML form with a text input for a name, an email input, and a submit button.',
    template: `<!-- Your HTML form here -->`,
    language: 'html',
    test: (code: string) => {
      return code.includes('<form>') && code.includes('type="text"') && code.includes('type="email"') && code.includes('type="submit"');
    },
  },
  {
    id: 'html-list',
    title: 'Create an Ordered List',
    description: 'Create an ordered list in HTML with three list items: "First", "Second", "Third".',
    template: `<!-- Your HTML list here -->`,
    language: 'html',
    test: (code: string) => {
        return code.includes('<ol>') && code.match(/<li>/g)?.length === 3;
    }
  },
  {
    id: 'html-table',
    title: 'Create a Simple Table',
    description: 'Create an HTML table with 2 columns ("Product", "Price") and 3 rows of data.',
    template: `<!-- Your HTML table here -->`,
    language: 'html',
    test: (code: string) => {
        return code.includes('<table>') && code.match(/<tr>/g)?.length >= 3 && code.match(/<td>/g)?.length >= 4;
    }
  },
  {
    id: 'html-image',
    title: 'Add an Image',
    description: 'Embed an image using the `<img>` tag. Use a placeholder URL like "https://placehold.co/200x100".',
    template: `<!-- Your HTML image here -->`,
    language: 'html',
    test: (code: string) => {
        return code.includes('<img') && code.includes('src=');
    }
  },
  {
    id: 'html-semantic',
    title: 'Semantic Page Layout',
    description: 'Structure a basic webpage using semantic HTML5 tags: <header>, <nav>, <main>, and <footer>.',
    template: `<!-- Your semantic layout here -->`,
    language: 'html',
    test: (code: string) => {
        return code.includes('<header>') && code.includes('<nav>') && code.includes('<main>') && code.includes('<footer>');
    }
  },
  // CSS Challenges
  {
    id: 'css-button-style',
    title: 'Style a Button',
    description: 'Write CSS to style a button with a blue background, white text, and a light-blue background on hover.',
    template: `button {\n  /* Your CSS here */\n}`,
    language: 'css',
    test: (code: string) => {
      return code.includes('background-color: blue') && code.includes('color: white') && /:hover\s*{[^}]*background-color:\s*lightblue/.test(code);
    },
  },
  {
    id: 'center-div',
    title: 'Center a Div',
    description: 'Write CSS using Flexbox to center a div both horizontally and vertically inside its parent container.',
    template: `.parent {\n  display: flex;\n  height: 200px; /* for testing */ \n  /* Your CSS here */\n}\n\n.child {\n  width: 100px;\n  height: 100px;\n}`,
    language: 'css',
    test: (code: string) => {
      return code.includes('justify-content: center') && code.includes('align-items: center');
    }
  },
  {
    id: 'css-card',
    title: 'Create a Card Component',
    description: 'Style a div to look like a card with a border, padding, and a subtle box-shadow.',
    template: `.card {\n  /* Your CSS here */\n}`,
    language: 'css',
    test: (code: string) => {
      return code.includes('border:') && code.includes('padding:') && code.includes('box-shadow:');
    }
  },
  {
    id: 'css-navbar',
    title: 'Simple Navbar',
    description: 'Style an unordered list to be a horizontal navigation bar with space between links.',
    template: `nav ul {\n  display: flex;\n  list-style-type: none;\n  /* Your CSS here */\n}`,
    language: 'css',
    test: (code: string) => {
      return code.includes('display: flex') && (code.includes('justify-content: space-between') || code.includes('justify-content: space-around') || code.includes('gap:'));
    }
  },
  {
    id: 'css-input-focus',
    title: 'Style Input on Focus',
    description: 'Change the border color of a text input when it is in the :focus state.',
    template: `input:focus {\n  /* Your CSS here */\n}`,
    language: 'css',
    test: (code: string) => {
        return /input:focus\s*{[^}]*border-color:/.test(code);
    }
  },
  {
    id: 'css-grid',
    title: 'Simple 2-Column Grid',
    description: 'Create a responsive 2-column grid layout using CSS Grid.',
    template: `.grid-container {\n  display: grid;\n  /* Your CSS here */\n}`,
    language: 'css',
    test: (code: string) => {
      return code.includes('display: grid') && code.includes('grid-template-columns:');
    }
  },
];

const languageOptions = [
  { value: 'c', label: 'C' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

type TestResult = {
  status: 'success' | 'failure';
  message: string;
} | null;

export default function CodingChallenges() {
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0].value);
  
  const filteredChallenges = useMemo(
    () => challenges.filter((c) => c.language === selectedLanguage),
    [selectedLanguage]
  );
  
  const [activeChallengeId, setActiveChallengeId] = useState(filteredChallenges.length > 0 ? filteredChallenges[0].id : '');
  const activeChallenge = challenges.find((c) => c.id === activeChallengeId);
  const [code, setCode] = useState(activeChallenge ? activeChallenge.template : '');
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [emojiBlast, setEmojiBlast] = useState<string | null>(null);

  useEffect(() => {
    // When language changes, update the filtered list and reset the active challenge
    const newFilteredChallenges = challenges.filter((c) => c.language === selectedLanguage);
    if (newFilteredChallenges.length > 0) {
      setActiveChallengeId(newFilteredChallenges[0].id);
    } else {
      setActiveChallengeId('');
    }
  }, [selectedLanguage]);

  useEffect(() => {
    const newChallenge = challenges.find((c) => c.id === activeChallengeId);
    if (newChallenge) {
      setCode(newChallenge.template);
    } else {
      setCode('');
    }
    setTestResult(null);
  }, [activeChallengeId]);


  useEffect(() => {
    if (emojiBlast) {
      const timer = setTimeout(() => setEmojiBlast(null), 2000); // Emoji disappears after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [emojiBlast]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };
  
  const handleChallengeChange = (id: string) => {
    setActiveChallengeId(id);
  };

  const handleRunTests = () => {
    if (!activeChallenge) return;
    setIsRunning(true);
    setTestResult(null);
    setEmojiBlast(null);
    
    setTimeout(() => {
      try {
        const success = activeChallenge.test(code);
        if (success) {
          setTestResult({ status: 'success', message: 'All tests passed! Great job!' });
          setEmojiBlast('😊');
          playSuccessSound();
        } else {
          setTestResult({ status: 'failure', message: 'Test failed. Hint: Check for edge cases and syntax.' });
          setEmojiBlast('😢');
          playFailureSound();
        }
      } catch (error: any) {
        console.error("Test execution error:", error);
        setTestResult({ status: 'failure', message: `An error occurred: ${error.message}` });
        setEmojiBlast('😢');
        playFailureSound();
      } finally {
        setIsRunning(false);
      }
    }, 1000);
  };
  
  if (!activeChallenge) {
      return (
         <div className="flex flex-col gap-6 relative">
             <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold font-headline">Coding Challenges</h1>
                <p className="text-muted-foreground">Test your skills with our coding challenges.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Select Language:</span>
                   <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Card>
                <CardHeader>
                    <CardTitle>No challenges available</CardTitle>
                    <CardDescription>Please select a different language.</CardDescription>
                </CardHeader>
              </Card>
         </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {emojiBlast && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in">
          <div className="text-8xl animate-in zoom-in-50 fade-in duration-500">
            {emojiBlast}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Coding Challenges</h1>
        <p className="text-muted-foreground">Test your skills with our coding challenges.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-medium">Select Language:</span>
           <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <span className="text-sm font-medium">Select Challenge:</span>
          <Select value={activeChallengeId} onValueChange={handleChallengeChange} disabled={!filteredChallenges.length}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select a challenge" />
            </SelectTrigger>
            <SelectContent>
              {filteredChallenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
