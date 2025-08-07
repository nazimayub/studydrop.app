
'use server';
/**
 * @fileOverview A flow for generating flashcards from notes.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The output type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateFlashcardsInputSchema = z.object({
  noteContent: z.string().describe('The full text content of the note to generate flashcards from.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
    question: z.string().describe('The question or term on the front of the flashcard.'),
    answer: z.string().describe('The answer or definition on the back of the flashcard.'),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;


const GenerateFlashcardsOutputSchema = z.object({
    flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert at creating educational flashcards from study notes. Analyze the following note content and generate a set of flashcards. Each flashcard should have a clear question and a concise answer.

Note Content:
{{{noteContent}}}`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
    return generateFlashcardsFlow(input);
}
