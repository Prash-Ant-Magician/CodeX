'use server';
/**
 * @fileOverview An AI-powered TypeScript code compiler and executor simulation.
 *
 * - runTypescriptCode - A function that handles the code compilation and execution simulation process.
 * - RunTypescriptCodeInput - The input type for the runTypescriptCode function.
 * - RunTypescriptCodeOutput - The return type for the runTypescriptCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunTypescriptCodeInputSchema = z.object({
  code: z.string().describe('The TypeScript code to be "compiled" and "executed".'),
});
export type RunTypescriptCodeInput = z.infer<typeof RunTypescriptCodeInputSchema>;

const RunTypescriptCodeOutputSchema = z.object({
  compilationOutput: z.string().describe('The simulated TypeScript compiler (tsc) output, including type errors or a success message.'),
  success: z.boolean().describe('Whether the compilation was successful or not.'),
  executionOutput: z.string().optional().describe('The simulated output of the executed program if compilation is successful.'),
});
export type RunTypescriptCodeOutput = z.infer<typeof RunTypescriptCodeOutputSchema>;

export async function runTypescriptCode(input: RunTypescriptCodeInput): Promise<RunTypescriptCodeOutput> {
  return runTypescriptCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compileAndRunTypeScriptPrompt',
  input: {schema: RunTypescriptCodeInputSchema},
  output: {schema: RunTypescriptCodeOutputSchema},
  prompt: `You are an expert TypeScript compiler (like tsc) and runtime environment (like Node.js). You will receive a snippet of TypeScript code.
First, analyze the code for any type errors or syntax errors.

- If there are errors, respond as a real TypeScript compiler would. Provide the error message (e.g., "TS2322: Type 'string' is not assignable to type 'number'.") in the 'compilationOutput' field. Set the 'success' field to false. Do not provide any execution output.
- If the code is valid and has no compilation errors, respond with a "Compilation successful" message in the 'compilationOutput' field. Set the 'success' field to true.
- If and only if the compilation is successful, then simulate the execution of the code and provide the program's output (e.g., what would be printed to the console via console.log) in the 'executionOutput' field.

TypeScript Code:
\`\`\`typescript
{{{code}}}
\`\`\`
`,
});

const runTypescriptCodeFlow = ai.defineFlow(
  {
    name: 'runTypescriptCodeFlow',
    inputSchema: RunTypescriptCodeInputSchema,
    outputSchema: RunTypescriptCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
