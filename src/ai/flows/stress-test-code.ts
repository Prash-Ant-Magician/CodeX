'use server';
/**
 * @fileOverview An AI-powered code stress tester.
 *
 * - stressTestCode - A function that analyzes code for performance and robustness.
 * - StressTestCodeInput - The input type for the stressTestCode function.
 * - StressTestCodeOutput - The return type for the stressTestCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StressTestCodeInputSchema = z.object({
  code: z.string().describe('The code to be stress-tested.'),
  language: z.string().describe('The programming language of the code.'),
});
export type StressTestCodeInput = z.infer<typeof StressTestCodeInputSchema>;

const StressTestCodeOutputSchema = z.object({
  estimatedComplexity: z.string().describe("The estimated time and space complexity (Big O notation) of the code."),
  performanceAnalysis: z.string().describe("An analysis of potential performance bottlenecks, such as nested loops or inefficient data structures."),
  suggestedTestCases: z.array(z.string()).describe("A list of suggested edge cases or large inputs to test the code's robustness (e.g., empty arrays, large numbers, specific patterns)."),
  concurrencyIssues: z.string().describe("An analysis of potential issues if the code were run in a multi-threaded or concurrent environment."),
});
export type StressTestCodeOutput = z.infer<typeof StressTestCodeOutputSchema>;

export async function stressTestCode(input: StressTestCodeInput): Promise<StressTestCodeOutput> {
  return stressTestCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stressTestCodePrompt',
  input: {schema: StressTestCodeInputSchema},
  output: {schema: StressTestCodeOutputSchema},
  prompt: `You are an expert software engineer and competitive programming coach. You will receive a snippet of code in a specific language and you need to perform a "stress test" analysis.

Analyze the provided code and generate a report with the following information:

1.  **Estimated Complexity**: Provide the time and space complexity in Big O notation (e.g., "Time: O(n), Space: O(1)").
2.  **Performance Analysis**: Identify any potential performance bottlenecks. For example, mention if there are inefficient loops, suboptimal data structures for the problem, or redundant calculations.
3.  **Suggested Test Cases**: Propose a list of challenging test cases to verify the code's correctness and robustness. Include edge cases (e.g., empty inputs, single-element inputs, very large inputs, inputs with duplicates, pre-sorted or reverse-sorted data).
4.  **Concurrency Issues**: Briefly describe any potential problems that might arise if this code were to be executed in a concurrent or multi-threaded environment (e.g., race conditions, non-thread-safe data structures).

Language: {{{language}}}
Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
`,
});

const stressTestCodeFlow = ai.defineFlow(
  {
    name: 'stressTestCodeFlow',
    inputSchema: StressTestCodeInputSchema,
    outputSchema: StressTestCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
