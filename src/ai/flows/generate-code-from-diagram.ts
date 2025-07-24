'use server';
/**
 * @fileOverview An AI agent for generating code from a diagram or flowchart description.
 *
 * - generateCodeFromDiagram - A function that handles generating code from a logical structure.
 * - GenerateCodeFromDiagramInput - The input type for the generateCodeFromDiagram function.
 * - GenerateCodeFromDiagramOutput - The return type for the generateCodeFromDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeFromDiagramInputSchema = z.object({
  diagram: z.string().describe('A structured text description of the logic, like a flowchart or pseudocode.'),
  language: z.string().describe('The programming language for the output code.'),
});
export type GenerateCodeFromDiagramInput = z.infer<typeof GenerateCodeFromDiagramInputSchema>;

const GenerateCodeFromDiagramOutputSchema = z.object({
  code: z.string().describe('The generated code snippet.'),
  explanation: z.string().describe('A brief explanation of the generated code.'),
});
export type GenerateCodeFromDiagramOutput = z.infer<typeof GenerateCodeFromDiagramOutputSchema>;

export async function generateCodeFromDiagram(input: GenerateCodeFromDiagramInput): Promise<GenerateCodeFromDiagramOutput> {
  return generateCodeFromDiagramFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeFromDiagramPrompt',
  input: {schema: GenerateCodeFromDiagramInputSchema},
  output: {schema: GenerateCodeFromDiagramOutputSchema},
  prompt: `You are an expert software engineer who specializes in converting logical diagrams, flowcharts, and pseudocode into clean, functional code.

You will receive a structured description of a program's logic and a target programming language. Your task is to generate the code that implements this logic.

Also provide a brief, high-level explanation of how the generated code works.

Target Language: {{language}}

Logic Description:
---
{{diagram}}
---
`,
});

const generateCodeFromDiagramFlow = ai.defineFlow(
  {
    name: 'generateCodeFromDiagramFlow',
    inputSchema: GenerateCodeFromDiagramInputSchema,
    outputSchema: GenerateCodeFromDiagramOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
