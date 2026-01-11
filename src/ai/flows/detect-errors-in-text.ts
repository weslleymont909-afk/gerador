'use server';

/**
 * @fileOverview An AI agent that detects potential errors in user-pasted text for pre-budget PDF generation.
 *
 * - detectErrorsInText - A function that detects errors in the input text.
 * - DetectErrorsInTextInput - The input type for the detectErrorsInText function.
 * - DetectErrorsInTextOutput - The return type for the detectErrorsInText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectErrorsInTextInputSchema = z.object({
  text: z
    .string()
    .describe('The text pasted by the user, containing order details and customer information.'),
});
export type DetectErrorsInTextInput = z.infer<typeof DetectErrorsInTextInputSchema>;

const DetectErrorsInTextOutputSchema = z.object({
  errors: z.array(
    z.string().describe('A list of potential errors found in the input text.')
  ).describe('A list of potential errors detected in the text.')
});
export type DetectErrorsInTextOutput = z.infer<typeof DetectErrorsInTextOutputSchema>;

export async function detectErrorsInText(input: DetectErrorsInTextInput): Promise<DetectErrorsInTextOutput> {
  return detectErrorsInTextFlow(input);
}

const detectErrorsInTextPrompt = ai.definePrompt({
  name: 'detectErrorsInTextPrompt',
  input: {schema: DetectErrorsInTextInputSchema},
  output: {schema: DetectErrorsInTextOutputSchema},
  prompt: `You are an AI assistant specializing in detecting errors and inconsistencies in text extracted from user input, specifically for pre-budget generation.

  Analyze the following text and identify any potential errors, missing information, or formatting inconsistencies that could cause problems during PDF generation. Be as specific as possible, list all possible errors you can find and return them as a list. If the text is well-formatted and contains all necessary information, return an empty list.

  Text: {{{text}}}
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const detectErrorsInTextFlow = ai.defineFlow(
  {
    name: 'detectErrorsInTextFlow',
    inputSchema: DetectErrorsInTextInputSchema,
    outputSchema: DetectErrorsInTextOutputSchema,
  },
  async input => {
    const {output} = await detectErrorsInTextPrompt(input);
    return output!;
  }
);
