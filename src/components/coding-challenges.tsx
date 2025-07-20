
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

const challenges = {
  c: {
    "Basics": [
      {
        id: 'c-hello-world',
        title: 'C: Hello, World!',
        description: 'Write a C program that includes the `stdio.h` header and prints "Hello, C!" to the console.',
        template: `#include <stdio.h>\n\nint main() {\n  // Your code here\n  return 0;\n}`,
        test: (code: string) => code.includes('#include <stdio.h>') && code.includes('printf("Hello, C!");'),
      },
      {
        id: 'c-sum-variables',
        title: 'C: Sum of Two Numbers',
        description: 'Declare two integer variables, assign them values, and print their sum.',
        template: `#include <stdio.h>\n\nint main() {\n  int a = 5;\n  int b = 10;\n  // Your code here to print the sum\n  return 0;\n}`,
        test: (code: string) => /printf\(".*%d.*",\s*a\s*\+\s*b\s*\)/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'c-for-loop',
        title: 'C: For Loop',
        description: 'Write a C program that uses a `for` loop to print numbers from 1 to 5, each on a new line.',
        template: `#include <stdio.h>\n\nint main() {\n  // Your for loop here\n  return 0;\n}`,
        test: (code: string) => code.includes('for') && /for\s*\(.*int\s+i\s*=\s*1;.*i\s*<=\s*5;.*i\s*\+\+.*\)/.test(code.replace(/\s/g, '')),
      },
    ],
    "Pointers & Memory": [
        {
            id: 'c-pointer-basics',
            title: 'Pointer Basics',
            description: 'Declare an integer `x` and a pointer `ptr` that stores the address of `x`. Print both the value of `x` and the value `ptr` points to.',
            template: `#include <stdio.h>\n\nint main() {\n  int x = 10;\n  // Your pointer code here\n  return 0;\n}`,
            test: (code: string) => /printf\(.*%d.*,\s*\*ptr\)/.test(code.replace(/\s/g, ''))
        },
    ],
    "Data Structures": [
        {
            id: 'c-array-sum',
            title: 'Sum of Array Elements',
            description: 'Write a function `sum_array` that takes an integer array and its size, and returns the sum of its elements.',
            template: `#include <stdio.h>\n\nint sum_array(int arr[], int size) {\n  // Your code here\n}\n\nint main() {\n  int my_arr[] = {1, 2, 3, 4, 5};\n  int total = sum_array(my_arr, 5);\n  printf("Sum: %d\\n", total); // Expected: 15\n  return 0;\n}`,
            test: (code: string) => {
                // This is a basic check. Real testing would require compilation & execution.
                return code.includes('for') && code.includes('sum +=')
            }
        },
    ]
  },
  python: {
    "Basics": [
      {
        id: 'python-hello-world',
        title: 'Python: Hello, World!',
        description: 'Write a Python script that prints "Hello, Python!" to the console.',
        template: `# Your code here`,
        test: (code: string) => /print\(['"]Hello, Python!['"]\)/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'python-sum-function',
        title: 'Python: Sum Function',
        description: 'Define a function `add` that takes two numbers and returns their sum.',
        template: `def add(a, b):\n  # Your code here`,
        test: (code: string) => {
          try {
            const fullCode = `${code}\n\nassert add(5, 10) == 15\nassert add(-1, 1) == 0`;
            // This is a simplified test; a real environment would execute this.
            return code.includes('return a + b');
          } catch { return false; }
        },
      },
    ],
    "Data Structures": [
      {
        id: 'python-list-comprehension',
        title: 'Python: List of Squares',
        description: 'Use a list comprehension to create a list of the first 5 square numbers (1, 4, 9, 16, 25). Assign it to a variable `squares`.',
        template: `squares = [] # Your list comprehension here`,
        test: (code: string) => /squares\s*=\s*\[\s*i\s*\*\*\s*2\s+for\s+i\s+in\s+range\(\s*1\s*,\s*6\s*\)\s*\]/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'python-dict-access',
        title: 'Dictionary Access',
        description: 'Create a dictionary for a user with keys "name" and "age". Then, print the value of the "name" key.',
        template: `user = {"name": "Alice", "age": 30}\n# Your code here`,
        test: (code: string) => /print\(user\[['"]name['"]\]\)/.test(code.replace(/\s/g, ''))
      },
    ],
    "Object-Oriented Programming": [
      {
        id: 'python-class',
        title: 'Simple Class',
        description: 'Create a `Dog` class with an `__init__` method that sets a `name` attribute, and a `bark` method that returns "Woof!".',
        template: `class Dog:\n  # Your code here`,
        test: (code: string) => code.includes('class Dog:') && code.includes('def __init__') && code.includes('def bark')
      }
    ]
  },
  java: {
    "Basics": [
      {
        id: 'java-hello-world',
        title: 'Java: Hello, World!',
        description: 'Write a Java program that prints "Hello, Java!" to the console inside the main method.',
        template: `public class Main {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}`,
        test: (code: string) => /System\.out\.println\(['"]Hello, Java!['"]\);/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'java-sum-variables',
        title: 'Java: Sum of Two Numbers',
        description: 'Declare two integer variables, `a` and `b`, assign them values, and print their sum.',
        template: `public class Main {\n  public static void main(String[] args) {\n    int a = 5;\n    int b = 10;\n    // Your code here to print the sum\n  }\n}`,
        test: (code: string) => /System\.out\.println\(\s*a\s*\+\s*b\s*\);/.test(code.replace(/\s/g, '')),
      },
    ],
    "Object-Oriented Programming": [
        {
            id: 'java-class',
            title: 'Simple Car Class',
            description: 'Create a `Car` class with a `color` attribute and a `startEngine` method that prints "Engine started!".',
            template: `public class Car {\n  String color = "Red";\n\n  // Your method here\n\n  public static void main(String[] args) {\n    Car myCar = new Car();\n    myCar.startEngine();\n  }\n}`,
            test: (code: string) => code.includes('void startEngine()') && code.includes('System.out.println("Engine started!");')
        },
        {
            id: 'java-constructor',
            title: 'Class Constructor',
            description: 'Create a `Person` class with a `name` attribute and a constructor that initializes it.',
            template: `public class Person {\n  String name;\n\n  // Your constructor here\n\n  public static void main(String[] args) {\n    Person person = new Person("John");\n    System.out.println(person.name);\n  }\n}`,
            test: (code: string) => /public Person\(String personName\)\s*{\s*name = personName;\s*}/.test(code.replace(/\s/g, ''))
        }
    ],
    "Data Structures": [
        {
            id: 'java-string-length',
            title: 'Java: String Length',
            description: 'Create a string variable and print its length to the console.',
            template: `public class Main {\n  public static void main(String[] args) {\n    String myString = "CodeLeap";\n    // Your code here to print the length\n  }\n}`,
            test: (code: string) => /System\.out\.println\(myString\.length\(\)\);/.test(code.replace(/\s/g, '')),
        },
    ]
  },
  javascript: {
    "Basics": [
        {
        id: 'sum-array',
        title: 'Sum of Array',
        description: 'Write a function that takes an array of numbers and returns their sum.',
        template: `function sumArray(arr) {\n  // Your code here\n}`,
        test: (code: string) => {
          try {
            const fn = new Function(`${code}\nreturn sumArray;`)();
            return fn([1, 2, 3]) === 6 && fn([-1, 0, 1]) === 0 && fn([]) === 0;
          } catch { return false; }
        },
      },
      {
        id: 'reverse-string',
        title: 'Reverse a String',
        description: 'Write a function that takes a string and returns it in reverse.',
        template: `function reverseString(str) {\n  // Your code here\n}`,
        test: (code: string) => {
          try {
            const fn = new Function(`${code}\nreturn reverseString;`)();
            return fn('hello') === 'olleh' && fn('world') === 'dlrow' && fn('') === '';
          } catch { return false; }
        },
      },
    ],
    "Algorithms": [
      {
        id: 'fizzbuzz',
        title: 'FizzBuzz',
        description: 'Write a function that returns an array with numbers from 1 to 15. For multiples of 3, use "Fizz". For multiples of 5, use "Buzz". For multiples of both, use "FizzBuzz".',
        template: `function fizzBuzz() {\n  // Your code here, return an array\n}`,
        test: (code: string) => {
          try {
            const fn = new Function(`${code}\nreturn fizzBuzz;`)();
            const result = fn();
            const expected = [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'];
            return Array.isArray(result) && result.length === 15 && result.every((v, i) => String(v) == String(expected[i]));
          } catch { return false; }
        },
      },
      {
        id: 'factorial',
        title: 'Factorial Finder',
        description: 'Write a function that computes the factorial of a non-negative integer.',
        template: `function factorial(n) {\n  // Your code here\n}`,
        test: (code: string) => {
          try {
            const fn = new Function(`${code}\nreturn factorial;`)();
            return fn(5) === 120 && fn(0) === 1 && fn(1) === 1;
          } catch { return false; }
        },
      },
    ]
  },
  html: {
    "Basics": [
      {
        id: 'html-form',
        title: 'Simple HTML Form',
        description: 'Create an HTML form with a text input for a name, an email input, and a submit button.',
        template: `<!-- Your HTML form here -->`,
        test: (code: string) => code.includes('<form>') && code.includes('type="text"') && code.includes('type="email"') && code.includes('type="submit"'),
      },
      {
        id: 'html-list',
        title: 'Create an Ordered List',
        description: 'Create an ordered list in HTML with three list items: "First", "Second", "Third".',
        template: `<!-- Your HTML list here -->`,
        test: (code: string) => code.includes('<ol>') && code.match(/<li>/g)?.length === 3,
      },
    ]
  },
  css: {
    "Basics": [
        {
        id: 'css-button-style',
        title: 'Style a Button',
        description: 'Write CSS to style a button with a blue background, white text, and a light-blue background on hover.',
        template: `button {\n  /* Your CSS here */\n}`,
        test: (code: string) => code.includes('background-color') && code.includes('color') && /:hover\s*{[^}]*background-color/.test(code),
      },
      {
        id: 'center-div',
        title: 'Center a Div',
        description: 'Write CSS using Flexbox to center a div both horizontally and vertically inside its parent container.',
        template: `.parent {\n  display: flex;\n  height: 200px; /* for testing */ \n  /* Your CSS here */\n}\n\n.child {\n  width: 100px;\n  height: 100px;\n}`,
        test: (code: string) => code.includes('justify-content: center') && code.includes('align-items: center'),
      }
    ]
  }
};

type LanguageKey = keyof typeof challenges;

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
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>('c');
  
  const defaultCategory = Object.keys(challenges[selectedLanguage])[0];
  const defaultChallenge = challenges[selectedLanguage][defaultCategory][0];

  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [activeChallengeId, setActiveChallengeId] = useState<string>(defaultChallenge.id);

  const activeChallenge = useMemo(() => {
    return challenges[selectedLanguage]?.[selectedCategory]?.find(c => c.id === activeChallengeId);
  }, [selectedLanguage, selectedCategory, activeChallengeId]);
  
  const [code, setCode] = useState(activeChallenge ? activeChallenge.template : '');
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [emojiBlast, setEmojiBlast] = useState<string | null>(null);

  // Safely update category and challenge when language changes
  useEffect(() => {
    const newCategories = challenges[selectedLanguage];
    const firstCategory = Object.keys(newCategories)[0];
    setSelectedCategory(firstCategory);
    
    const firstChallengeId = newCategories[firstCategory]?.[0]?.id;
    if (firstChallengeId) {
        setActiveChallengeId(firstChallengeId);
    } else {
        setActiveChallengeId('');
    }
  }, [selectedLanguage]);

  // Safely update challenge when category changes
  useEffect(() => {
    const newChallenges = challenges[selectedLanguage]?.[selectedCategory] || [];
    const firstChallengeId = newChallenges[0]?.id;
    if (firstChallengeId) {
      setActiveChallengeId(firstChallengeId);
    } else {
        setActiveChallengeId('');
    }
  }, [selectedCategory, selectedLanguage]);
  
  // Update code and clear results when the challenge changes
  useEffect(() => {
    if (activeChallenge) {
      setCode(activeChallenge.template);
      setTestResult(null);
    } else {
      setCode('');
    }
  }, [activeChallengeId, activeChallenge]);


  useEffect(() => {
    if (emojiBlast) {
      const timer = setTimeout(() => setEmojiBlast(null), 2000); // Emoji disappears after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [emojiBlast]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang as LanguageKey);
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
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
  
  const currentCategories = Object.keys(challenges[selectedLanguage]);
  const currentChallenges = challenges[selectedLanguage]?.[selectedCategory] || [];

  if (!activeChallenge) {
      return (
         <div className="flex flex-col gap-6 relative">
             <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold font-headline">Coding Challenges</h1>
                <p className="text-muted-foreground">Test your skills with our coding challenges.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <CardDescription>Please select a different language or category.</CardDescription>
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <span className="text-sm font-medium">Select Category:</span>
           <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {currentCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <span className="text-sm font-medium">Select Challenge:</span>
          <Select value={activeChallengeId} onValueChange={handleChallengeChange} disabled={!currentChallenges.length}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select a challenge" />
            </SelectTrigger>
            <SelectContent>
              {currentChallenges.map((challenge) => (
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
