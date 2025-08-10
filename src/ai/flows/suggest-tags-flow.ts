
'use server';
/**
 * @fileOverview A flow for suggesting tags for a note based on its content.
 *
 * - suggestTags - A function that handles the tag suggestion process.
 * - SuggestTagsInput - The input type for the suggestTags function.
 * - SuggestTagsOutput - The output type for the suggestTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestTagsInputSchema = z.object({
  noteTitle: z.string().describe('The title of the note to generate tags from.'),
  noteContent: z.string().describe('The full text content of the note to generate tags from.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;


const SuggestTagsOutputSchema = z.object({
    tags: z.array(z.string()).describe('An array of suggested tags (topics or keywords).'),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;


const prompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {schema: SuggestTagsInputSchema},
  output: {schema: SuggestTagsOutputSchema},
  prompt: `You are an expert at analyzing text and suggesting relevant tags. Analyze the following note title and content, then suggest a list of 5-7 relevant topics or keywords that could be used as tags.

Note Title:
{{{noteTitle}}}

Note Content:
{{{noteContent}}}`,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
    return suggestTagsFlow(input);
}
