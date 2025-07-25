
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, XCircle, CheckCircle, Flame } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { getCompletedChallenges, markChallengeAsCompleted, getLocalCompletedChallenges, markLocalChallengeAsCompleted } from '@/lib/challenge-progress';
import { useSettings } from './settings';
import { stressTestCode, StressTestCodeOutput } from '@/ai/flows/stress-test-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { playKeystrokeSound } from '@/lib/sounds';

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
    "Basics & Control Flow": [
      {
        id: 'c-hello-world',
        title: 'Hello, World!',
        description: 'Write a C program that includes the `stdio.h` header and prints "Hello, C!" to the console followed by a newline.',
        template: `#include <stdio.h>\n\nint main() {\n  // Your code here\n  return 0;\n}`,
        test: (code: string) => code.includes('#include <stdio.h>') && /printf\("Hello, C!\\n"\);/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'c-variables',
        title: 'Variables and Data Types',
        description: 'Declare an integer `age` with value 25, a float `pi` with value 3.14, and a char `initial` with value \'C\'. Print all three variables.',
        template: `#include <stdio.h>\n\nint main() {\n  // Declare and initialize variables here\n\n  // Print the variables here\n  return 0;\n}`,
        test: (code: string) => /intage=25;.*floatpi=3.14;.*charinitial='C';/.test(code.replace(/\s/g, '')) && code.includes('printf'),
      },
      {
        id: 'c-if-else',
        title: 'If-Else Statement',
        description: 'Write a program that checks if a number is positive, negative, or zero and prints the result.',
        template: `#include <stdio.h>\n\nint main() {\n  int number = -5;\n  // Your if-else logic here\n  return 0;\n}`,
        test: (code: string) => code.includes('if') && code.includes('else if') && code.includes('else'),
      },
       {
        id: 'c-for-loop',
        title: 'For Loop',
        description: 'Write a C program that uses a `for` loop to print numbers from 1 to 5, each on a new line.',
        template: `#include <stdio.h>\n\nint main() {\n  // Your for loop here\n  return 0;\n}`,
        test: (code: string) => code.includes('for') && /for\s*\(.*int\s+i\s*=\s*1;.*i\s*<=\s*5;.*i\s*\+\+.*\)/.test(code.replace(/\s/g, '')),
      },
    ],
    "Functions": [
      {
        id: 'c-simple-function',
        title: 'Simple Function',
        description: 'Write a function `int add(int a, int b)` that returns the sum of two integers. Call it from `main` and print the result.',
        template: `#include <stdio.h>\n\n// Define your function here\n\nint main() {\n  int result = add(10, 20);\n  printf("Result: %d\\n", result);\n  return 0;\n}`,
        test: (code: string) => /intadd\(int(a|a),int(b|b)\){returna\+b;}/.test(code.replace(/\s/g, ''))
      },
      {
        id: 'c-factorial-recursion',
        title: 'Factorial using Recursion',
        description: 'Write a recursive function to calculate the factorial of a number.',
        template: `#include <stdio.h>\n\nint factorial(int n) {\n  // Your recursive logic here\n}\n\nint main() {\n  printf("Factorial of 5 is %d\\n", factorial(5));\n  return 0;\n}`,
        test: (code: string) => code.includes('factorial(n - 1)') && code.includes('if (n <= 1)'),
      },
    ],
    "Pointers & Memory": [
      {
        id: 'c-pointer-basics',
        title: 'Pointer Basics',
        description: 'Declare an integer `x` and a pointer `ptr` that stores the address of `x`. Print both the value of `x` and the value `ptr` points to.',
        template: `#include <stdio.h>\n\nint main() {\n  int x = 10;\n  // Your pointer code here\n  return 0;\n}`,
        test: (code: string) => /int\*ptr=&x;.*printf\(.*%d.*,\*ptr\)/.test(code.replace(/\s/g, ''))
      },
      {
        id: 'c-swap-pointers',
        title: 'Swap with Pointers',
        description: 'Write a function `void swap(int *a, int *b)` that swaps the values of two integers using pointers.',
        template: `#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n  // Your swap logic here\n}\n\nint main() {\n  int x = 5, y = 10;\n  swap(&x, &y);\n  printf("x=%d, y=%d\\n", x, y); // Should print x=10, y=5\n  return 0;\n}`,
        test: (code: string) => code.includes('int temp = *a') && code.includes('*a = *b') && code.includes('*b = temp'),
      },
    ],
    "Arrays & Strings": [
        {
            id: 'c-array-sum',
            title: 'Sum of Array Elements',
            description: 'Write a function `sum_array` that takes an integer array and its size, and returns the sum of its elements.',
            template: `#include <stdio.h>\n\nint sum_array(int arr[], int size) {\n  // Your code here\n}\n\nint main() {\n  int my_arr[] = {1, 2, 3, 4, 5};\n  int total = sum_array(my_arr, 5);\n  printf("Sum: %d\\n", total); // Expected: 15\n  return 0;\n}`,
            test: (code: string) => code.includes('for') && (code.includes('sum +=') || code.includes('sum = sum +'))
        },
        {
          id: 'c-string-reverse',
          title: 'Reverse a String',
          description: 'Write a function `void reverse(char *str)` that reverses a string in-place.',
          template: `#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char *str) {\n  // Your code here\n}\n\nint main() {\n  char myStr[] = "hello";\n  reverse(myStr);\n  printf("%s\\n", myStr); // Expected: olleh\n  return 0;\n}`,
          test: (code: string) => code.includes('strlen') && code.includes('for') && code.includes('str[i]'),
        }
    ],
    "Data Structures": [
       {
          id: 'c-struct',
          title: 'Structs',
          description: 'Define a `struct Student` with `name` (char array) and `id` (int). Create an instance, populate it, and print its members.',
          template: `#include <stdio.h>\n#include <string.h>\n\n// Define the struct here\n\nint main() {\n  // Create and use the struct here\n  return 0;\n}`,
          test: (code: string) => /structStudent{.*};/.test(code.replace(/\s/g, '')) && code.includes('strcpy'),
        },
        {
          id: 'c-linked-list',
          title: 'Singly Linked List',
          description: 'Implement a basic singly linked list with functions to insert a node at the end and print the list.',
          template: `#include <stdio.h>\n#include <stdlib.h>\n\n// Linked list implementation here\n\nint main() {\n // Use your linked list here\n return 0;\n}`,
          test: (code: string) => code.includes('struct Node') && code.includes('next') && code.includes('malloc'),
        }
    ]
  },
  python: {
    "Basics & Control Flow": [
      {
        id: 'python-hello-world',
        title: 'Hello, World!',
        description: 'Write a Python script that prints "Hello, Python!" to the console.',
        template: `# Your code here`,
        test: (code: string) => /print\(['"]Hello, Python!['"]\)/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'python-variables',
        title: 'Variables',
        description: 'Create a variable `name` with the value "CodeLeap" and a variable `year` with the value 2024. Print them in a formatted string.',
        template: `# Your code here`,
        test: (code: string) => /name\s*=\s*['"]CodeLeap['"]/.test(code) && /year\s*=\s*2024/.test(code) && (code.includes('f"') || code.includes('.format')),
      },
      {
        id: 'python-if-elif-else',
        title: 'If-Elif-Else',
        description: 'Write a script that checks if a grade is "A", "B", "C", or "Fail" based on a score variable.',
        template: `score = 85\n# Your code here`,
        test: (code: string) => code.includes('if') && code.includes('elif') && code.includes('else'),
      },
      {
        id: 'python-for-loop',
        title: 'For Loop',
        description: 'Use a for loop to iterate through a list of numbers and print only the even ones.',
        template: `numbers = [1, 2, 3, 4, 5, 6]\n# Your code here`,
        test: (code: string) => code.includes('for') && code.includes('in numbers:') && code.includes('% 2 == 0'),
      },
    ],
    "Functions & Lambdas": [
      {
        id: 'python-sum-function',
        title: 'Sum Function',
        description: 'Define a function `add` that takes two numbers and returns their sum.',
        template: `def add(a, b):\n  # Your code here`,
        test: (code: string) => code.includes('return a + b'),
      },
       {
        id: 'python-lambda',
        title: 'Lambda Function',
        description: 'Create a lambda function that takes a number `x` and returns `x` squared. Assign it to a variable `square`.',
        template: `square = # Your lambda function here\nprint(square(5))`,
        test: (code: string) => /square=lambda\s*x:\s*x\s*\*\*\s*2/.test(code.replace(/\s/g, '')),
      },
    ],
    "Data Structures": [
       {
        id: 'python-list-comprehension',
        title: 'List of Squares',
        description: 'Use a list comprehension to create a list of the first 5 square numbers (1, 4, 9, 16, 25). Assign it to a variable `squares`.',
        template: `squares = # Your list comprehension here`,
        test: (code: string) => /squares=\[\s*i\s*\*\*\s*2\s*for\s*i\s*in\s*range\(\s*1\s*,\s*6\s*\)\s*\]/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'python-dict-access',
        title: 'Dictionary Access',
        description: 'Create a dictionary for a user with keys "name" and "age". Then, print the value of the "name" key.',
        template: `user = {"name": "Alice", "age": 30}\n# Your code here`,
        test: (code: string) => /print\(user\[['"]name['"]\]\)/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'python-set-operations',
        title: 'Set Operations',
        description: 'Given two sets, find their union and intersection.',
        template: `set1 = {1, 2, 3}\nset2 = {3, 4, 5}\n# Find and print the union and intersection`,
        test: (code: string) => (code.includes('.union(set2)') || code.includes('set1 | set2')) && (code.includes('.intersection(set2)') || code.includes('set1 & set2'))
      },
    ],
    "Object-Oriented Programming": [
      {
        id: 'python-class',
        title: 'Simple Class',
        description: 'Create a `Dog` class with an `__init__` method that sets a `name` attribute, and a `bark` method that returns "Woof!".',
        template: `class Dog:\n  # Your code here`,
        test: (code: string) => code.includes('class Dog:') && code.includes('def __init__') && code.includes('self.name') && code.includes('def bark'),
      },
      {
        id: 'python-inheritance',
        title: 'Inheritance',
        description: 'Create a `Vehicle` parent class and a `Car` child class that inherits from `Vehicle` and has its own `drive` method.',
        template: `class Vehicle:\n  def __init__(self, brand):\n    self.brand = brand\n\n# Your Car class here\n\nmy_car = Car("Ford")\nprint(my_car.brand)\nmy_car.drive()`,
        test: (code: string) => code.includes('class Car(Vehicle):') && code.includes('super().__init__'),
      },
    ],
    "Algorithms": [
        {
          id: 'python-linear-search',
          title: 'Linear Search',
          description: 'Write a function `linear_search(data, target)` that returns the index of the target in the list, or -1 if not found.',
          template: `def linear_search(data, target):\n  # Your code here`,
          test: (code: string) => code.includes('for') && code.includes('if data[i] == target:') && code.includes('return i'),
        },
        {
          id: 'python-binary-search',
          title: 'Binary Search (Iterative)',
          description: 'Write a function `binary_search(sorted_data, target)` that finds a target in a sorted list.',
          template: `def binary_search(sorted_data, target):\n  # Your code here`,
          test: (code: string) => code.includes('while') && code.includes('mid =') && code.includes('low') && code.includes('high'),
        },
    ]
  },
  java: {
    "Basics & Control Flow": [
      {
        id: 'java-hello-world',
        title: 'Hello, World!',
        description: 'Write a Java program that prints "Hello, Java!" to the console inside the main method.',
        template: `public class Main {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}`,
        test: (code: string) => /System\.out\.println\(['"]Hello, Java!['"]\);/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'java-sum-variables',
        title: 'Sum of Two Numbers',
        description: 'Declare two integer variables, `a` and `b`, assign them values, and print their sum.',
        template: `public class Main {\n  public static void main(String[] args) {\n    int a = 5;\n    int b = 10;\n    // Your code here to print the sum\n  }\n}`,
        test: (code: string) => /System\.out\.println\(\s*a\s*\+\s*b\s*\);/.test(code.replace(/\s/g, '')),
      },
      {
        id: 'java-for-loop',
        title: 'For Loop',
        description: 'Use a for loop to print numbers from 1 to 5.',
        template: `public class Main {\n  public static void main(String[] args) {\n    // Your for loop here\n  }\n}`,
        test: (code: string) => /for\(inti=1;i<=5;i\+\+\)/.test(code.replace(/\s/g,''))
      },
    ],
    "Object-Oriented Programming": [
        {
            id: 'java-class',
            title: 'Simple Car Class',
            description: 'Create a `Car` class with a `color` String attribute and a `startEngine` method that prints "Engine started!". In `main`, create a `Car` object and call its method.',
            template: `// You can write the Car class in the same file or a new one for this simulation\n\npublic class Main {\n  public static void main(String[] args) {\n    // Create a Car object and call its methods here\n  }\n}`,
            test: (code: string) => code.includes('class Car') && code.includes('void startEngine()') && code.includes('System.out.println("Engine started!");')
        },
        {
            id: 'java-constructor',
            title: 'Class Constructor',
            description: 'Create a `Person` class with a `name` String attribute and a constructor that initializes it.',
            template: `public class Main {\n  public static void main(String[] args) {\n    Person person = new Person("John");\n    System.out.println(person.name);\n  }\n}\n\nclass Person {\n  String name;\n\n  // Your constructor here\n}`,
            test: (code: string) => /public Person\(StringpersonName\)\s*{\s*this\.name=personName;\s*}/.test(code.replace(/\s/g, ''))
        },
        {
          id: 'java-inheritance',
          title: 'Inheritance',
          description: 'Create an `Animal` superclass and a `Dog` subclass that extends `Animal` and overrides a `makeSound` method.',
          template: `class Animal {\n  public void makeSound() {\n    System.out.println("Some animal sound");\n  }\n}\n\n// Your Dog class here\n\npublic class Main {\n  public static void main(String[] args) {\n    Dog myDog = new Dog();\n    myDog.makeSound(); // Expected: Bark\n  }\n}`,
          test: (code: string) => code.includes('class Dog extends Animal') && code.includes('@Override'),
        }
    ],
    "Data Structures & Collections": [
        {
            id: 'java-array',
            title: 'Arrays',
            description: 'Create an array of integers and use a loop to calculate and print their sum.',
            template: `public class Main {\n  public static void main(String[] args) {\n    int[] numbers = {10, 20, 30, 40};\n    // Your code here\n  }\n}`,
            test: (code: string) => code.includes('for') && (code.includes('sum +=') || code.includes('sum = sum +')),
        },
        {
          id: 'java-arraylist',
          title: 'ArrayList',
          description: 'Use an `ArrayList` to store a list of Strings. Add three names and then print the size of the list.',
          template: `import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    // Your ArrayList code here\n  }\n}`,
          test: (code: string) => code.includes('new ArrayList<String>()') && code.includes('.add(') && code.includes('.size()'),
        },
        {
          id: 'java-hashmap',
          title: 'HashMap',
          description: 'Use a `HashMap` to store user IDs (Integer) and usernames (String). Put two users and then retrieve and print one by their ID.',
          template: `import java.util.HashMap;\n\npublic class Main {\n  public static void main(String[] args) {\n    // Your HashMap code here\n  }\n}`,
          test: (code: string) => code.includes('new HashMap<Integer, String>()') && code.includes('.put(') && code.includes('.get('),
        }
    ],
    "Exception Handling": [
      {
        id: 'java-try-catch',
        title: 'Try-Catch Block',
        description: 'Write code that attempts to divide by zero inside a `try` block and catches the `ArithmeticException` in a `catch` block, printing an error message.',
        template: `public class Main {\n  public static void main(String[] args) {\n    // Your try-catch block here\n  }\n}`,
        test: (code: string) => code.includes('try') && code.includes('catch (ArithmeticException e)'),
      }
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
            return fn([1, 2, 3]) === 6 && fn([-1, 0, 1]) === 0;
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
  typescript: {
    "Basics": [
      {
        id: 'ts-hello-world',
        title: 'Hello, TypeScript!',
        description: 'Declare a variable of type string and assign it "Hello, TypeScript!". Print it to the console.',
        template: `let message: string = "Hello, TypeScript!";\nconsole.log(message);`,
        test: (code: string) => /let\s+message:\s*string\s*=\s*['"]Hello, TypeScript!['"];/.test(code) && code.includes('console.log(message)')
      },
      {
        id: 'ts-typed-function',
        title: 'Typed Function',
        description: 'Write a function `add` that takes two numbers and returns a number.',
        template: `function add(a: number, b: number): number {\n  // Your code here\n}`,
        test: (code: string) => /return a \+ b;/.test(code.replace(/\s/g, ''))
      }
    ]
  },
  ruby: {
    "Basics": [
      {
        id: 'ruby-hello-world',
        title: 'Hello, Ruby!',
        description: 'Write a Ruby script that prints "Hello, Ruby!" to the console.',
        template: `# Your code here`,
        test: (code: string) => /puts\s*['"]Hello, Ruby!['"]/.test(code.replace(/\s/g, ''))
      },
      {
        id: 'ruby-simple-method',
        title: 'Simple Method',
        description: 'Define a method `greet` that takes a name and prints a greeting.',
        template: `def greet(name)\n  # Your code here\nend\n\ngreet("CodeLeap")`,
        test: (code: string) => code.includes('puts "Hello, #{name}!"') || code.includes("puts 'Hello, ' + name + '!'")
      }
    ]
  },
  r: {
    "Basics": [
      {
        id: 'r-hello-world',
        title: 'Hello, R!',
        description: 'Write an R script that prints "Hello, R!" to the console.',
        template: `# Your code here`,
        test: (code: string) => /print\(['"]Hello, R!['"]\)/.test(code.replace(/\s/g, ''))
      },
      {
        id: 'r-vector-sum',
        title: 'Vector Sum',
        description: 'Create a numeric vector and calculate its sum.',
        template: `my_vector <- c(10, 20, 30, 40)\n# Calculate and print the sum of my_vector`,
        test: (code: string) => code.includes('sum(my_vector)')
      }
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
  { value: 'typescript', label: 'TypeScript' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'r', label: 'R' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

type TestResult = {
  status: 'success' | 'failure';
  message: string;
} | null;

export default function CodingChallenges() {
  const { user } = useAuth();
  const { isTypingSoundEnabled } = useSettings();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>('c');
  
  const defaultCategory = Object.keys(challenges[selectedLanguage])[0];
  const defaultChallenge = challenges[selectedLanguage][defaultCategory][0];

  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [activeChallengeId, setActiveChallengeId] = useState<string>(defaultChallenge.id);

  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());

  const activeChallenge = useMemo(() => {
    return challenges[selectedLanguage]?.[selectedCategory]?.find(c => c.id === activeChallengeId);
  }, [selectedLanguage, selectedCategory, activeChallengeId]);
  
  const [code, setCode] = useState(activeChallenge ? activeChallenge.template : '');
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressTestResult, setStressTestResult] = useState<StressTestCodeOutput | null>(null);
  const [isStressTestDialogOpen, setIsStressTestDialogOpen] = useState(false);
  const [emojiBlast, setEmojiBlast] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProgress = useCallback(async () => {
    if (user) {
      const completed = await getCompletedChallenges(user.uid);
      setCompletedChallenges(new Set(completed));
    } else {
      const completed = getLocalCompletedChallenges();
      setCompletedChallenges(new Set(completed));
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);


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
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isTypingSoundEnabled) {
      playKeystrokeSound();
    }
    setCode(e.target.value);
  }

  const handleRunTests = () => {
    if (!activeChallenge) return;
    setIsRunning(true);
    setTestResult(null);
    setEmojiBlast(null);
    
    setTimeout(async () => {
      try {
        const success = activeChallenge.test(code);
        if (success) {
          setTestResult({ status: 'success', message: 'All tests passed! Great job!' });
          setEmojiBlast('🎉');
          playSuccessSound();
          
          if (!completedChallenges.has(activeChallenge.id)) {
            if (user) {
              await markChallengeAsCompleted(user.uid, activeChallenge.id);
            } else {
              markLocalChallengeAsCompleted(activeChallenge.id);
            }
            fetchProgress(); // Re-fetch to update the state and UI
          }
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
  
  const handleStressTest = async () => {
    if (!activeChallenge) return;
    setIsStressTesting(true);
    setStressTestResult(null);
    try {
        const result = await stressTestCode({ code, language: selectedLanguage });
        setStressTestResult(result);
        setIsStressTestDialogOpen(true);
    } catch (error) {
        console.error("Error running stress test:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to run stress test analysis."});
    } finally {
        setIsStressTesting(false);
    }
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
                  <div className="flex items-center gap-2">
                     {completedChallenges.has(challenge.id) && <CheckCircle className="h-4 w-4 text-green-500" />}
                     <span>{challenge.title}</span>
                  </div>
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
            onChange={handleCodeChange}
            className="font-code h-64 bg-muted/50"
            placeholder="Enter your solution here..."
          />
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <div className="flex gap-2">
            <Button onClick={handleRunTests} disabled={isRunning} className="bg-primary hover:bg-primary/90">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Tests'
              )}
            </Button>
            <Button onClick={handleStressTest} disabled={isStressTesting} variant="outline">
              {isStressTesting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Flame className="mr-2 h-4 w-4" /> Stress Test </>
              )}
            </Button>
          </div>
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
      
      {/* Stress Test Result Dialog */}
      <Dialog open={isStressTestDialogOpen} onOpenChange={setIsStressTestDialogOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Code Stress Test Analysis</DialogTitle>
                  <DialogDescription>AI-powered analysis of your code's performance and robustness.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] -mx-6">
                <div className="px-6 space-y-4">
                  {stressTestResult ? (
                      <>
                          <div className="space-y-2">
                              <h3 className="font-semibold">Estimated Complexity</h3>
                              <p className="text-sm font-mono p-2 bg-muted rounded-md">{stressTestResult.estimatedComplexity}</p>
                          </div>
                          <div className="space-y-2">
                              <h3 className="font-semibold">Performance Analysis</h3>
                              <p className="text-sm text-muted-foreground">{stressTestResult.performanceAnalysis}</p>
                          </div>
                           <div className="space-y-2">
                              <h3 className="font-semibold">Concurrency Issues</h3>
                              <p className="text-sm text-muted-foreground">{stressTestResult.concurrencyIssues}</p>
                          </div>
                          <div className="space-y-2">
                              <h3 className="font-semibold">Suggested Test Cases</h3>
                              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                  {stressTestResult.suggestedTestCases.map((testCase, i) => (
                                      <li key={i}><code className="font-mono bg-muted p-1 rounded-sm">{testCase}</code></li>
                                  ))}
                              </ul>
                          </div>
                      </>
                  ) : (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                  )}
                 </div>
              </ScrollArea>
              <DialogFooter>
                  <Button onClick={() => setIsStressTestDialogOpen(false)}>Close</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
```