'use server';
/**
 * @fileOverview An AI-powered Python code executor simulation.
 *
 * - runPythonCode - A function that handles the code execution simulation process.
 * - RunPythonCodeInput - The input type for the runPythonCode function.
 * - RunPythonCodeOutput - The return type for the runPythonCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunPythonCodeInputSchema = z.object({
  code: z.string().describe('The Python code to be "executed".'),
});
export type RunPythonCodeInput = z.infer<typeof RunPythonCodeInputSchema>;

const RunPythonCodeOutputSchema = z.object({
  errorOutput: z.string().optional().describe('The simulated error output if the code fails to run.'),
  success: z.boolean().describe('Whether the execution was successful or not.'),
  executionOutput: z.string().optional().describe('The simulated output of the executed program if it runs successfully.'),
});
export type RunPythonCodeOutput = z.infer<typeof RunPythonCodeOutputSchema>;

export async function runPythonCode(input: RunPythonCodeInput): Promise<RunPythonCodeOutput> {
  return runPythonCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runPythonCodePrompt',
  input: {schema: RunPythonCodeInputSchema},
  output: {schema: RunPythonCodeOutputSchema},
  prompt: `You are an expert Python interpreter. You will receive a snippet of Python code.
Analyze the code and simulate its execution.

- If the code runs into an error (e.g., syntax error, runtime error), provide the full error traceback in the 'errorOutput' field. Set the 'success' field to false. Do not provide any 'executionOutput'.
- If the code executes successfully, provide what would be printed to standard output in the 'executionOutput' field. Set the 'success' field to true, and leave 'errorOutput' empty.

Python Code:
\`\`\`python
{{{code}}}
\`\`\`
`,
});

const runPythonCodeFlow = ai.defineFlow(
  {
    name: 'runPythonCodeFlow',
    inputSchema: RunPythonCodeInputSchema,
    outputSchema: RunPythonCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
