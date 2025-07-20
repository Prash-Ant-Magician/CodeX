'use server';
/**
 * @fileOverview An AI-powered R code executor simulation.
 *
 * - runRCode - A function that handles the code execution simulation process.
 * - RunRCodeInput - The input type for the runRCode function.
 * - RunRCodeOutput - The return type for the runRCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunRCodeInputSchema = z.object({
  code: z.string().describe('The R code to be "executed".'),
});
export type RunRCodeInput = z.infer<typeof RunRCodeInputSchema>;

const RunRCodeOutputSchema = z.object({
  errorOutput: z.string().optional().describe('The simulated error output if the code fails to run.'),
  success: z.boolean().describe('Whether the execution was successful or not.'),
  executionOutput: z.string().optional().describe('The simulated output of the executed program if it runs successfully.'),
});
export type RunRCodeOutput = z.infer<typeof RunRCodeOutputSchema>;

export async function runRCode(input: RunRCodeInput): Promise<RunRCodeOutput> {
  return runRCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runRCodePrompt',
  input: {schema: RunRCodeInputSchema},
  output: {schema: RunRCodeOutputSchema},
  prompt: `You are an expert R interpreter. You will receive a snippet of R code.
Analyze the code and simulate its execution.

- If the code runs into an error (e.g., syntax error, runtime error), provide the full error message in the 'errorOutput' field. Set the 'success' field to false. Do not provide any 'executionOutput'.
- If the code executes successfully, provide what would be printed to the console in the 'executionOutput' field. Set the 'success' field to true, and leave 'errorOutput' empty.

R Code:
\`\`\`r
{{{code}}}
\`\`\`
`,
});

const runRCodeFlow = ai.defineFlow(
  {
    name: 'runRCodeFlow',
    inputSchema: RunRCodeInputSchema,
    outputSchema: RunRCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
