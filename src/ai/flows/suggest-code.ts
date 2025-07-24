'use server';
/**
 * @fileOverview An AI agent for providing code suggestions.
 *
 * - suggestCode - A function that suggests the next line(s) of code.
 * - SuggestCodeInput - The input type for the suggestCode function.
 * - SuggestCodeOutput - The return type for the suggestCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeInputSchema = z.object({
  code: z.string().describe('The existing code.'),
  language: z.string().describe('The programming language of the code.'),
});
export type SuggestCodeInput = z.infer<typeof SuggestCodeInputSchema>;

const SuggestCodeOutputSchema = z.object({
  suggestion: z.string().describe('The suggested code to add.'),
});
export type SuggestCodeOutput = z.infer<typeof SuggestCodeOutputSchema>;

export async function suggestCode(input: SuggestCodeInput): Promise<SuggestCodeOutput> {
  return suggestCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodePrompt',
  input: {schema: SuggestCodeInputSchema},
  output: {schema: SuggestCodeOutputSchema},
  prompt: `You are an expert programmer in {{language}}.
Analyze the following code and suggest the very next logical line or block of code.
Your suggestion should be concise and directly follow the existing code's logic. It should be a completion of the thought, not just the next token.
Only provide the raw code for the suggestion, with no explanations or markdown.

Existing Code:
\`\`\`{{language}}
{{{code}}}
\`\`\`

Next Code Suggestion:
`,
});

const suggestCodeFlow = ai.defineFlow(
  {
    name: 'suggestCodeFlow',
    inputSchema: SuggestCodeInputSchema,
    outputSchema: SuggestCodeOutputSchema,
  },
  async input => {
    // If the code is empty, return a common starting point.
    if (!input.code.trim()) {
      let suggestion = '';
      switch (input.language) {
        case 'python':
          suggestion = 'def main():\n    pass';
          break;
        case 'java':
          suggestion = 'public static void main(String[] args) {\n    \n}';
          break;
        case 'c':
          suggestion = 'int main() {\n    return 0;\n}';
          break;
        case 'javascript':
          suggestion = 'console.log("Hello, World!");';
          break;
        case 'typescript':
          suggestion = 'console.log("Hello, TypeScript!");';
          break;
        case 'ruby':
            suggestion = 'puts "Hello, Ruby!"';
            break;
        case 'r':
            suggestion = 'print("Hello, R!")';
            break;
        case 'html':
          suggestion = '<h1></h1>';
          break;
        case 'css':
          suggestion = 'body {\n    \n}';
          break;
      }
       return { suggestion };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
