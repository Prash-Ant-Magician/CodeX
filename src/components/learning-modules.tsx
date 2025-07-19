import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

const modules = [
  {
    title: "HTML Basics",
    lessons: [
      {
        title: "Introduction to HTML",
        content: "HTML (HyperText Markup Language) is the standard language for creating web pages. It describes the structure of a web page.",
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
        content: "An HTML element is defined by a start tag, some content, and an end tag. For example, `<p>This is a paragraph.</p>`.",
        code: `<h1>This is a heading</h1>
<p>This is a paragraph.</p>
<button>This is a button</button>`,
      },
    ],
  },
  {
    title: "CSS Fundamentals",
    lessons: [
      {
        title: "Introduction to CSS",
        content: "CSS (Cascading Style Sheets) is a language used to describe the presentation of a document written in a markup language like HTML.",
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
    ],
  },
  {
    title: "JavaScript 101",
    lessons: [
      {
        title: "Introduction to JavaScript",
        content: "JavaScript is a programming language that enables you to create dynamically updating content, control multimedia, animate images, and much more.",
        code: `function greet() {
  let name = prompt('What is your name?');
  alert('Hello, ' + name + '!');
}

greet();`,
      },
      {
        title: "Variables and Data Types",
        content: "Variables are containers for storing data values. In JavaScript, there are different data types: String, Number, Bigint, Boolean, Undefined, Null, Symbol, and Object.",
        code: `let name = "CodeLeap"; // String
let version = 1; // Number
let isAwesome = true; // Boolean
let user = { firstName: 'John', lastName: 'Doe' }; // Object`,
      },
    ],
  },
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
