'use server';
/**
 * @fileOverview An AI-powered C code compiler and executor simulation.
 *
 * - compileCode - A function that handles the code compilation and execution simulation process.
 * - CompileCodeInput - The input type for the compileCode function.
 * - CompileCodeOutput - The return type for the compileCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompileCodeInputSchema = z.object({
  code: z.string().describe('The C code to be "compiled" and "executed".'),
});
export type CompileCodeInput = z.infer<typeof CompileCodeInputSchema>;

const CompileCodeOutputSchema = z.object({
  compilationOutput: z.string().describe('The simulated compiler output, including errors or a success message.'),
  success: z.boolean().describe('Whether the compilation was successful or not.'),
  executionOutput: z.string().optional().describe('The simulated output of the executed program if compilation is successful.'),
});
export type CompileCodeOutput = z.infer<typeof CompileCodeOutputSchema>;

export async function compileCode(input: CompileCodeInput): Promise<CompileCodeOutput> {
  return compileCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compileAndRunCodePrompt',
  input: {schema: CompileCodeInputSchema},
  output: {schema: CompileCodeOutputSchema},
  prompt: `You are an expert C language compiler and runtime environment. You will receive a snippet of C code.
First, analyze the code for any syntax or logical errors.

- If there are errors, respond as a real compiler would. Provide the error message, line number, and a brief explanation in the 'compilationOutput' field. Set the 'success' field to false. Do not provide any execution output.
- If the code is valid and has no errors, respond with a "Compilation successful" message in the 'compilationOutput' field. Set the 'success' field to true.
- If and only if the compilation is successful, then simulate the execution of the code and provide the program's output (e.g., what would be printed to the console via printf) in the 'executionOutput' field.

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
