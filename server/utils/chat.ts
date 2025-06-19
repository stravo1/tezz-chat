import { generateObject, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { cerebras } from '@ai-sdk/cerebras';
import { z } from 'zod';

export async function generateChatTitle({
  message,
  model = cerebras('llama3.1-8b'),
  fallbackModel,
}: {
  message: UIMessage | any;
  model?: any;
  fallbackModel?: any;
}) {
  try {
    const { object } = await generateObject({
      model,
      schema: z.object({
        title: z
          .string()
          .describe(
            'A concise and descriptive title for the chat conversation (maximum 80 characters)'
          ),
      }),
      system: `You are our title maker assistant at tezz chat that generates concise and descriptive titles for chat conversations.
    - Generate a short title based on the user's first message (maximum 80 characters)
    - Strictly it must be short
    - You only generate the title not the actual response of the query
    - The title should be a clear summary of the main topic or question
    - Make it attractive and engaging
    - Do not include quotes, colons, or special characters
    - Keep it simple and easy to understand`,
      prompt: message.content,
      temperature: 0.7,
    });
    return object.title;
  } catch (error) {
    if (fallbackModel) {
      const { object } = await generateObject({
        model: fallbackModel,
        schema: z.object({
          title: z
            .string()
            .describe(
              'A concise and descriptive title for the chat conversation (maximum 80 characters)'
            ),
        }),
        system: `You are our title maker assistant at tezz chat that generates concise and descriptive titles for chat conversations.
    - Generate a short title based on the user's first message (maximum 80 characters)
    - Strictly it must be short
    - You only generate the title not the actual response of the query
    - The title should be a clear summary of the main topic or question
    - Make it attractive and engaging
    - Do not include quotes, colons, or special characters
    - Keep it simple and easy to understand`,
        prompt: message.content,
        temperature: 0.7,
      });
      return object.title;
    }
    throw error;
  }
}
