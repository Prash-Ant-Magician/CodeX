// src/ai/flows/debug-code.ts
'use server';
/**
 * @fileOverview An AI-powered debugging assistant.
 *
 * - debugCode - A function that handles the code debugging process.
 * - DebugCodeInput - The input type for the debugCode function.
 * - DebugCodeOutput - The return type for the debugCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DebugCodeInputSchema = z.object({
  code: z.string().describe('The code to be debugged.'),
  language: z.string().describe('The programming language of the code.'),
  description: z.string().optional().describe('The description of the code and what it is supposed to do.'),
});
export type DebugCodeInput = z.infer<typeof DebugCodeInputSchema>;

const DebugCodeOutputSchema = z.object({
  suggestions: z.string().describe('Suggestions for improvements and error fixes.'),
});
export type DebugCodeOutput = z.infer<typeof DebugCodeOutputSchema>;

export async function debugCode(input: DebugCodeInput): Promise<DebugCodeOutput> {
  return debugCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'debugCodePrompt',
  input: {schema: DebugCodeInputSchema},
  output: {schema: DebugCodeOutputSchema},
  prompt: `You are an AI debugging assistant. You will receive code and its programming language. You will provide suggestions for improvements and error fixes.

Language: {{{language}}}
Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Description: {{{description}}}

Suggestions:`, 
});

const debugCodeFlow = ai.defineFlow(
  {
    name: 'debugCodeFlow',
    inputSchema: DebugCodeInputSchema,
    outputSchema: DebugCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
