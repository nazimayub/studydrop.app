
'use server';
/**
 * @fileOverview A flow for summarizing notes.
 *
 * - summarizeNote - A function that handles the note summarization process.
 * - SummarizeNoteInput - The input type for the summarizeNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeNoteInputSchema = z.object({
  noteContent: z.string().describe('The full text content of the note to be summarized.'),
});
export type SummarizeNoteInput = z.infer<typeof SummarizeNoteInputSchema>;


const prompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: SummarizeNoteInputSchema},
  prompt: `Summarize the following note content concisely. Focus on the key points and main ideas.

Note Content:
{{{noteContent}}}`,
});

const summarizeNoteFlow = ai.defineFlow(
  {
    name: 'summarizeNoteFlow',
    inputSchema: SummarizeNoteInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    const {text} = await ai.generate({
        prompt: await prompt.render(input),
    });
    return text;
  }
);


export async function summarizeNote(input: SummarizeNoteInput): Promise<string> {
    return summarizeNoteFlow(input);
}
