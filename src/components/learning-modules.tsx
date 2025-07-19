import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

const modules = [
  {
    title: "HTML Basics",
    lessons: [
      {
        title: "Introduction to HTML",
        content: "HTML (HyperText Markup Language) is the standard language for creating web pages. It describes the structure of a web page using a series of elements, which are represented by tags.",
        code: `<!DOCTYPE html>
<html>
<head>
  <title>Page Title</title>
</head>
<body>

  <h1>My First Heading</h1>
  <p>My first paragraph.</p>

</body>
</html>`,
      },
      {
        title: "HTML Elements",
        content: "An HTML element is defined by a start tag, some content, and an end tag. For example, `<p>This is a paragraph.</p>`. Some HTML elements have no content (like the <br> element). These elements are called empty elements.",
        code: `<h1>This is a heading</h1>
<p>This is a paragraph.</p>
<button>This is a button</button>
<a href="https://example.com">This is a link</a>`,
      },
      {
        title: "HTML Attributes",
        content: "Attributes provide additional information about HTML elements. They are always specified in the start tag and usually come in name/value pairs like name=\"value\". The `href` attribute on a link, or the `src` attribute on an image are common examples.",
        code: `<a href="https://www.google.com">A link to Google</a>

<img src="image.jpg" alt="An example image" width="100" height="100">`,
      },
      {
        title: "Forms and Inputs",
        content: "The `<form>` element is used to collect user input. It can contain various input elements like text fields, checkboxes, radio buttons, submit buttons, and more.",
        code: `<form action="/submit-data">
  <label for="fname">First name:</label><br>
  <input type="text" id="fname" name="fname"><br>
  <label for="lname">Last name:</label><br>
  <input type="text" id="lname" name="lname"><br><br>
  <input type="submit" value="Submit">
</form>`,
      },
      {
        title: "Working with Lists",
        content: "HTML offers two main types of lists: unordered lists (`<ul>`), which create bulleted lists, and ordered lists (`<ol>`), which create numbered lists. Each list item is defined with an `<li>` tag.",
        code: `<h2>Favorite Fruits (Unordered)</h2>
<ul>
  <li>Apples</li>
  <li>Bananas</li>
  <li>Oranges</li>
</ul>

<h2>Top 3 Movies (Ordered)</h2>
<ol>
  <li>The Godfather</li>
  <li>The Dark Knight</li>
  <li>Pulp Fiction</li>
</ol>`,
      },
      {
        title: "Creating Tables",
        content: "HTML tables allow you to arrange data into rows and columns. A table is defined with the `<table>` tag. `<tr>` defines a table row, `<th>` defines a table header, and `<td>` defines a table cell.",
        code: `<table border="1">
  <tr>
    <th>Firstname</th>
    <th>Lastname</th>
  </tr>
  <tr>
    <td>Peter</td>
    <td>Griffin</td>
  </tr>
  <tr>
    <td>Lois</td>
    <td>Griffin</td>
  </tr>
</table>`,
      },
    ],
  },
  {
    title: "CSS Fundamentals",
    lessons: [
      {
        title: "Introduction to CSS",
        content: "CSS (Cascading Style Sheets) is a language used to describe the presentation of a document written in a markup language like HTML. It handles the look and feel of a web page.",
        code: `body {
  background-color: lightblue;
}

h1 {
  color: white;
  text-align: center;
}`,
      },
      {
        title: "Selectors",
        content: "CSS selectors are used to find (or select) the HTML elements you want to style. We can divide CSS selectors into five categories: Simple selectors (select elements based on name, id, class), Combinator selectors, Pseudo-class selectors, Pseudo-elements selectors, and Attribute selectors.",
        code: `/* Selects all <p> elements */
p { 
  color: red; 
}

/* Selects element with id="example" */
#example { 
  font-size: 20px;
}

/* Selects all elements with class="item" */
.item {
  font-weight: bold;
}`,
      },
      {
        title: "The Box Model",
        content: "All HTML elements can be considered as boxes. In CSS, the term 'box model' is used when talking about design and layout. It is a box that wraps around every HTML element and consists of: margins, borders, padding, and the actual content.",
        code: `.box {
  width: 300px;
  border: 15px solid green;
  padding: 50px;
  margin: 20px;
}`,
      },
       {
        title: "Flexbox Layout",
        content: "The Flexbox Layout module makes it easier to design flexible responsive layout structures without using float or positioning. It allows items in a container to be aligned and distributed in a predictable way.",
        code: `.container {
  display: flex;
  justify-content: space-around; /* Distributes items evenly */
  align-items: center; /* Centers items vertically */
  height: 200px;
  background-color: #f0f0f0;
}`,
      },
    ],
  },
  {
    title: "JavaScript 101",
    lessons: [
      {
        title: "Introduction to JavaScript",
        content: "JavaScript is a programming language that enables you to create dynamically updating content, control multimedia, animate images, and much more. It's one of the core technologies of the World Wide Web.",
        code: `function greet() {
  let name = prompt('What is your name?');
  alert('Hello, ' + name + '!');
}

greet();`,
      },
      {
        title: "Variables and Data Types",
        content: "Variables are containers for storing data values. In JavaScript, there are different data types: String, Number, Bigint, Boolean, Undefined, Null, Symbol, and Object. You can declare variables using `var`, `let`, or `const`.",
        code: `let name = "CodeLeap"; // String
const version = 1; // Number (constant)
let isAwesome = true; // Boolean
let user = { firstName: 'John', lastName: 'Doe' }; // Object`,
      },
      {
        title: "Functions and Scope",
        content: "A function is a block of code designed to perform a particular task. A function is executed when 'something' invokes it (calls it). Variables defined inside a function are not accessible from outside the function (function scope).",
        code: `function add(a, b) {
  return a + b;
}

let result = add(5, 3); // result is 8`,
      },
      {
        title: "DOM Manipulation",
        content: "The Document Object Model (DOM) is a programming interface for web documents. It represents the page so that programs can change the document structure, style, and content. JavaScript can be used to manipulate the DOM, for example, to change the text of an element.",
        code: `// HTML: <p id="demo">Hello World</p>

const paragraph = document.getElementById("demo");
paragraph.textContent = "Hello CodeLeap!";
paragraph.style.color = "blue";`,
      },
    ],
  },
  {
    title: "React Essentials",
    lessons: [
      {
        title: "What is React?",
        content: "React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called 'components'.",
        code: `// This is a simple React component
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}`
      },
      {
        title: "Components and Props",
        content: "Components are independent and reusable bits of code. They serve the same purpose as JavaScript functions, but work in isolation and return HTML. Props (short for properties) are used to pass data from a parent component to a child component.",
        code: `function Greeting({ name }) {
  return <p>Welcome, {name}!</p>
}

function App() {
  return <Greeting name="Sarah" />;
}`
      },
      {
        title: "State and Hooks",
        content: "State allows React components to change their output over time in response to user actions, network responses, and anything else. Hooks are functions that let you 'hook into' React state and lifecycle features from function components. `useState` is a Hook that lets you add React state to function components.",
        code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`
      }
    ]
  },
  {
    title: "Web Accessibility (A11y)",
    lessons: [
      {
        title: "Why Accessibility Matters",
        content: "Web accessibility (also known as a11y) is the inclusive practice of ensuring there are no barriers that prevent interaction with, or access to, websites on the World Wide Web by people with physical disabilities, situational disabilities, and socio-economic restrictions on bandwidth and speed.",
        code: `<!-- Good: A descriptive link -->
<a href="/profile">View user profile</a>

<!-- Bad: A non-descriptive link -->
<a href="/profile">Click here</a>`
      },
      {
        title: "Semantic HTML",
        content: "Semantic HTML elements are those that clearly describe their meaning in a human- and machine-readable way. Using elements like `<nav>`, `<main>`, `<header>`, `<footer>`, and `<article>` instead of generic `<div>`s helps screen readers and search engines understand the structure of your page.",
        code: `<header>
  <h1>My Website</h1>
</header>
<nav>
  <a href="/home">Home</a>
  <a href="/about">About</a>
</nav>
<main>
  <p>This is the main content.</p>
</main>`
      },
      {
        title: "ARIA Roles",
        content: "Accessible Rich Internet Applications (ARIA) is a set of attributes that define ways to make web content and web applications more accessible to people with disabilities. You can use roles and aria-* attributes to add semantics where they are missing, for example, on a custom-built component.",
        code: `<div role="button" tabindex="0" aria-pressed="false">
  Custom Button
</div>

<div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
  75%
</div>`
      }
    ]
  }
];

export default function LearningModules() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline">Learning Modules</h1>
        <p className="text-muted-foreground">Start your coding journey with our interactive modules.</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {modules.map((module, moduleIndex) => (
          <AccordionItem value={`item-${moduleIndex}`} key={module.title}>
            <AccordionTrigger className="text-lg font-medium">{module.title}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4 pl-4">
                {module.lessons.map((lesson) => (
                  <Card key={lesson.title}>
                    <CardContent className="pt-6">
                      <h3 className="text-md font-semibold mb-2">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{lesson.content}</p>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        <code className="font-code text-sm">{lesson.code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
