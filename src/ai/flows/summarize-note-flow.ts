
'use server';
/**
 * @fileOverview A flow for summarizing notes.
 *
 * - summarizeNote - A function that handles the note summarization process.
 * - SummarizeNoteInput - The input type for the summarizeNote function.
 * - SummarizeNoteOutput - The output type for the summarizeNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeNoteInputSchema = z.object({
  noteContent: z.string().describe('The full text content of the note to be summarized.'),
});
export type SummarizeNoteInput = z.infer<typeof SummarizeNoteInputSchema>;

const SummarizeNoteOutputSchema = z.object({
    title: z.string().describe('A short, catchy title for the summary.'),
    summary: z.string().describe('A concise paragraph summarizing the key points of the note.'),
    keyPoints: z.array(z.string()).describe('A list of the most important key points or takeaways from the note.'),
});
export type SummarizeNoteOutput = z.infer<typeof SummarizeNoteOutputSchema>;


const prompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: SummarizeNoteInputSchema},
  output: {schema: SummarizeNoteOutputSchema},
  prompt: `You are an expert at summarizing educational notes. Analyze the following note content and provide a structured summary.

Your response must include:
1. A short, catchy title for the summary.
2. A concise paragraph that captures the main ideas.
3. A list of the most important key points or takeaways as a bulleted list.

Note Content:
{{{noteContent}}}`,
});

const summarizeNoteFlow = ai.defineFlow(
  {
    name: 'summarizeNoteFlow',
    inputSchema: SummarizeNoteInputSchema,
    outputSchema: SummarizeNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function summarizeNote(input: SummarizeNoteInput): Promise<SummarizeNoteOutput> {
    return summarizeNoteFlow(input);
}
