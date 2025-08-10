'use server';
/**
 * @fileOverview A flow for moderating user-generated text content.
 *
 * - moderateText - A function that checks text against safety classifiers.
 * - ModerateTextInput - The input type for the moderateText function.
 * - ModerateTextOutput - The output type for the moderateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ModerateTextInputSchema = z.object({
  text: z.string().describe('The text content to be moderated.'),
});
export type ModerateTextInput = z.infer<typeof ModerateTextInputSchema>;

export const ModerateTextOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the text is considered safe or not.'),
  reason: z.string().optional().describe('The reason why the text was flagged, if applicable.'),
});
export type ModerateTextOutput = z.infer<typeof ModerateTextOutputSchema>;


const moderateTextFlow = ai.defineFlow(
  {
    name: 'moderateTextFlow',
    inputSchema: ModerateTextInputSchema,
    outputSchema: ModerateTextOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: input.text,
      config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    // An empty response text means the content was blocked by a safety filter.
    if (!text) {
      return {
        isSafe: false,
        reason: 'The content was flagged as potentially harmful and could not be posted.',
      };
    }

    return { isSafe: true };
  }
);


export async function moderateText(input: ModerateTextInput): Promise<ModerateTextOutput> {
    return moderateTextFlow(input);
}
