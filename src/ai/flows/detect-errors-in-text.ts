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
  prompt: `Você é um assistente de IA especializado em detectar erros e inconsistências em textos inseridos por usuários, especificamente para a geração de pré-orçamentos.

  Analise o texto a seguir e identifique possíveis erros, informações ausentes ou inconsistências de formatação que possam causar problemas durante a geração do PDF. Seja o mais específico possível, liste todos os erros que encontrar e retorne-os como uma lista em português. Se o texto estiver bem formatado e contiver todas as informações necessárias, retorne uma lista vazia.

  Texto: {{{text}}}
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
