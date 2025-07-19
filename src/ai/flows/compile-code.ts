'use server';
/**
 * @fileOverview An AI-powered C code compiler simulation.
 *
 * - compileCode - A function that handles the code compilation simulation process.
 * - CompileCodeInput - The input type for the compileCode function.
 * - CompileCodeOutput - The return type for the compileCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompileCodeInputSchema = z.object({
  code: z.string().describe('The C code to be "compiled".'),
});
export type CompileCodeInput = z.infer<typeof CompileCodeInputSchema>;

const CompileCodeOutputSchema = z.object({
  output: z.string().describe('The simulated compiler output, including errors or a success message.'),
  success: z.boolean().describe('Whether the compilation was successful or not.'),
});
export type CompileCodeOutput = z.infer<typeof CompileCodeOutputSchema>;

export async function compileCode(input: CompileCodeInput): Promise<CompileCodeOutput> {
  return compileCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compileCodePrompt',
  input: {schema: CompileCodeInputSchema},
  output: {schema: CompileCodeOutputSchema},
  prompt: `You are an expert C language compiler. You will receive a snippet of C code.
Analyze the code for any syntax or logical errors.

- If there are errors, respond as a real compiler would. Provide the error message, line number, and a brief explanation. Set the 'success' field to false.
- If the code is valid and has no errors, respond with a "Compilation successful" message. Set the 'success' field to true.

Do not provide suggestions for code improvements unless it's part of an error message (like a missing semicolon).

C Code:
\`\`\`c
{{{code}}}
\`\`\`
`,
});

const compileCodeFlow = ai.defineFlow(
  {
    name: 'compileCodeFlow',
    inputSchema: CompileCodeInputSchema,
    outputSchema: CompileCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
