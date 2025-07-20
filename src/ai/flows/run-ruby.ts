'use server';
/**
 * @fileOverview An AI-powered Ruby code executor simulation.
 *
 * - runRubyCode - A function that handles the code execution simulation process.
 * - RunRubyCodeInput - The input type for the runRubyCode function.
 * - RunRubyCodeOutput - The return type for the runRubyCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunRubyCodeInputSchema = z.object({
  code: z.string().describe('The Ruby code to be "executed".'),
});
export type RunRubyCodeInput = z.infer<typeof RunRubyCodeInputSchema>;

const RunRubyCodeOutputSchema = z.object({
  errorOutput: z.string().optional().describe('The simulated error output if the code fails to run.'),
  success: z.boolean().describe('Whether the execution was successful or not.'),
  executionOutput: z.string().optional().describe('The simulated output of the executed program if it runs successfully.'),
});
export type RunRubyCodeOutput = z.infer<typeof RunRubyCodeOutputSchema>;

export async function runRubyCode(input: RunRubyCodeInput): Promise<RunRubyCodeOutput> {
  return runRubyCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runRubyCodePrompt',
  input: {schema: RunRubyCodeInputSchema},
  output: {schema: RunRubyCodeOutputSchema},
  prompt: `You are an expert Ruby interpreter. You will receive a snippet of Ruby code.
Analyze the code and simulate its execution.

- If the code runs into an error (e.g., syntax error, runtime error), provide the full error message in the 'errorOutput' field. Set the 'success' field to false. Do not provide any 'executionOutput'.
- If the code executes successfully, provide what would be printed to standard output (e.g., via 'puts') in the 'executionOutput' field. Set the 'success' field to true, and leave 'errorOutput' empty.

Ruby Code:
\`\`\`ruby
{{{code}}}
\`\`\`
`,
});

const runRubyCodeFlow = ai.defineFlow(
  {
    name: 'runRubyCodeFlow',
    inputSchema: RunRubyCodeInputSchema,
    outputSchema: RunRubyCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
