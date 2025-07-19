'use server';

/**
 * @fileOverview Code generation AI agent.
 *
 * - generateCodeFromPrompt - A function that generates code snippets based on user prompts.
 * - GenerateCodeFromPromptInput - The input type for the generateCodeFromPrompt function.
 * - GenerateCodeFromPromptOutput - The return type for the generateCodeFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeFromPromptInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the desired code snippet.'),
  language: z.string().describe('The programming language for the code snippet.'),
});
export type GenerateCodeFromPromptInput = z.infer<typeof GenerateCodeFromPromptInputSchema>;

const GenerateCodeFromPromptOutputSchema = z.object({
  code: z.string().describe('The generated code snippet.'),
});
export type GenerateCodeFromPromptOutput = z.infer<typeof GenerateCodeFromPromptOutputSchema>;

export async function generateCodeFromPrompt(input: GenerateCodeFromPromptInput): Promise<GenerateCodeFromPromptOutput> {
  return generateCodeFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeFromPromptPrompt',
  input: {schema: GenerateCodeFromPromptInputSchema},
  output: {schema: GenerateCodeFromPromptOutputSchema},
  prompt: `You are an expert software engineer specializing in {{language}}. Generate a concise, production-quality code snippet based on the following prompt. Only output the raw code, without any explanations, comments, or markdown formatting.

Prompt: {{prompt}}`,
});

const generateCodeFromPromptFlow = ai.defineFlow(
  {
    name: 'generateCodeFromPromptFlow',
    inputSchema: GenerateCodeFromPromptInputSchema,
    outputSchema: GenerateCodeFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
