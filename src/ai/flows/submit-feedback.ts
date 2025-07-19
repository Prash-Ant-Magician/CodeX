'use server';

/**
 * @fileOverview A flow for submitting user feedback and sending it via email.
 *
 * - submitFeedback - A function that handles submitting feedback.
 * - SubmitFeedbackInput - The input type for the submitFeedback function.
 * - SubmitFeedbackOutput - The return type for the submitFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';

const SubmitFeedbackInputSchema = z.object({
  name: z.string().optional().describe('The name of the user giving feedback.'),
  email: z.string().email().optional().describe('The email of the user.'),
  feedback: z.string().describe('The feedback content.'),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

const SubmitFeedbackOutputSchema = z.object({
  success: z.boolean().describe('Whether the feedback was processed successfully.'),
  message: z
    .string()
    .describe('A message to the user.'),
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
    
    // Setup Nodemailer transporter
    // IMPORTANT: You must configure these environment variables in a .env.local file
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CodeLeap Feedback" <${process.env.EMAIL_USER || 'noreply@example.com'}>`,
      to: 'prashantjha843319@gmail.com', // Developer's email address
      subject: 'New Feedback from CodeLeap User',
      html: `
        <h1>New Feedback Submission</h1>
        <p><strong>Name:</strong> ${input.name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${input.email || 'Not provided'}</p>
        <hr>
        <h2>Feedback:</h2>
        <p>${input.feedback}</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Feedback email sent successfully.');
      return {
        success: true,
        message: `Thank you for your feedback, ${input.name || 'friend'}! We appreciate you helping us improve CodeLeap.`,
      };
    } catch (error) {
      console.error('Error sending feedback email:', error);
      // Return a failure message. This helps in debugging email configuration.
      return {
        success: false,
        message: 'Could not send feedback email. Please check server configuration.',
      };
    }
  }
);
