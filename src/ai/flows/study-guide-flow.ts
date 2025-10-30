'use server';
/**
 * @fileOverview A flow for generating study guides using AI.
 *
 * - generateStudyGuide: The main function to call the AI flow.
 * - StudyGuideInput: The input type for the flow.
 * - StudyGuide: The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudyGuideInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate a study guide.'),
});
export type StudyGuideInput = z.infer<typeof StudyGuideInputSchema>;

const StudyGuideSchema = z.object({
  concepts: z
    .array(
      z.object({
        title: z.string().describe('The title of the concept.'),
        explanation: z
          .string()
          .describe('A clear and concise explanation of the concept.'),
      })
    )
    .describe('A list of key concepts related to the topic.'),
  practiceQuestions: z
    .array(z.string())
    .describe(
      'A list of practice questions to test understanding of the concepts.'
    ),
});
export type StudyGuide = z.infer<typeof StudyGuideSchema>;

export async function generateStudyGuide(
  input: StudyGuideInput
): Promise<StudyGuide> {
  return studyGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studyGuidePrompt',
  input: { schema: StudyGuideInputSchema },
  output: { schema: StudyGuideSchema },
  prompt: `You are an expert educator and study guide creator.
Your task is to generate a helpful study guide for the following topic: {{{topic}}}.

The study guide should consist of two parts:
1.  **Key Concepts**: Break down the topic into several important concepts. For each concept, provide a clear and easy-to-understand explanation.
2.  **Practice Questions**: Create a list of questions that will help a student test their knowledge and understanding of the presented concepts.

Generate a comprehensive and accurate study guide based on the provided topic.`,
});

const studyGuideFlow = ai.defineFlow(
  {
    name: 'studyGuideFlow',
    inputSchema: StudyGuideInputSchema,
    outputSchema: StudyGuideSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
