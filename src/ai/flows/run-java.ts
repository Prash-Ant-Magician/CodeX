'use server';
/**
 * @fileOverview An AI-powered Java code compiler and executor simulation.
 *
 * - runJavaCode - A function that handles the code compilation and execution simulation process.
 * - RunJavaCodeInput - The input type for the runJavaCode function.
 * - RunJavaCodeOutput - The return type for the runJavaCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunJavaCodeInputSchema = z.object({
  code: z.string().describe('The Java code to be "compiled" and "executed".'),
});
export type RunJavaCodeInput = z.infer<typeof RunJavaCodeInputSchema>;

const RunJavaCodeOutputSchema = z.object({
  compilationOutput: z.string().describe('The simulated compiler output, including errors or a success message.'),
  success: z.boolean().describe('Whether the compilation was successful or not.'),
  executionOutput: z.string().optional().describe('The simulated output of the executed program if compilation is successful.'),
});
export type RunJavaCodeOutput = z.infer<typeof RunJavaCodeOutputSchema>;

export async function runJavaCode(input: RunJavaCodeInput): Promise<RunJavaCodeOutput> {
  return runJavaCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compileAndRunJavaPrompt',
  input: {schema: RunJavaCodeInputSchema},
  output: {schema: RunJavaCodeOutputSchema},
  prompt: `You are an expert Java compiler and runtime environment. You will receive a snippet of Java code. The user expects the main entry point to be a public static void main(String[] args) method within a class.
First, analyze the code for any syntax or logical errors.

- If there are errors, respond as a real Java compiler would. Provide the error message in the 'compilationOutput' field. Set the 'success' field to false. Do not provide any execution output.
- If the code is valid and has no errors, respond with a "Compilation successful" message in the 'compilationOutput' field. Set the 'success' field to true.
- If and only if the compilation is successful, then simulate the execution of the code and provide the program's output (e.g., what would be printed to the console via System.out.println) in the 'executionOutput' field.

Java Code:
\`\`\`java
{{{code}}}
\`\`\`
`,
});

const runJavaCodeFlow = ai.defineFlow(
  {
    name: 'runJavaCodeFlow',
    inputSchema: RunJavaCodeInputSchema,
    outputSchema: RunJavaCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
