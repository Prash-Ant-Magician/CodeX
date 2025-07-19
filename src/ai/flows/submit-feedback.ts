'use server';

/**
 * @fileOverview A flow for submitting user feedback.
 *
 * - submitFeedback - A function that handles submitting feedback.
 * - SubmitFeedbackInput - The input type for the submitFeedback function.
 * - SubmitFeedbackOutput - The return type for the submitFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SubmitFeedbackInputSchema = z.object({
  name: z.string().optional().describe('The name of the user giving feedback.'),
  email: z.string().email().optional().describe('The email of the user.'),
  feedback: z.string().describe('The feedback content.'),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

const SubmitFeedbackOutputSchema = z.object({
  thankYouMessage: z
    .string()
    .describe('A thank you message to the user.'),
});
export type SubmitFeedbackOutput = z.infer<typeof SubmitFeedbackOutputSchema>;

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackOutput> {
  return submitFeedbackFlow(input);
}

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema,
  },
  async (input) => {
    console.log('Feedback received:', input);
    // In a real application, you would save this feedback to a database.
    return {
      thankYouMessage: `Thank you for your feedback, ${input.name || 'friend'}! We appreciate you helping us improve CodeLeap.`,
    };
  }
);
