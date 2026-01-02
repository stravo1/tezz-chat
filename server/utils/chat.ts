import { generateObject, UIMessage } from 'ai';
import { z } from 'zod';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

const cerebras = new Cerebras({
  apiKey: process.env['CEREBRAS_API_KEY'],
  // This is the default and can be omitted
});

async function generateChatTitleUsingCerebras(messaage: any) {
  console.log('Generating chat title using Cerebras for message:', messaage);
  const completionCreateResponse = await cerebras.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          "You are our title maker assistant at tezz chat that generates concise and descriptive titles for chat conversations.\n    - Generate a short title based on the user's first message (maximum 80 characters)\n    - Strictly it must be short and in JSON format\n    - You only generate the title not the actual response of the query\n    - The title should be a clear summary of the main topic or question\n    - Make it attractive and engaging\n    - Do not include quotes, colons, or special characters\n    - Keep it simple and easy to understand\n - Example: Input: 'How to use AI in healthcare?', Output: { title: 'AI in Healthcare' }",
      },
      {
        role: 'user',
        content: messaage.content,
      },
    ],
    model: 'gpt-oss-120b',
    stream: false,
    max_completion_tokens: 2048,
    temperature: 0.2,
    top_p: 1,
    response_format: { type: 'json_object' },
  });
  console.log('Cerebras response:', completionCreateResponse.choices[0].message.content);
  return JSON.parse(completionCreateResponse.choices[0].message.content).title;
}
export async function generateChatTitle({
  message,
  fallbackModel,
}: {
  message: UIMessage | any;
  model?: any;
  fallbackModel?: any;
}) {
  try {
    return await generateChatTitleUsingCerebras(message);
  } catch (error) {
    console.error('Error generating chat title:', error);
    if (fallbackModel) {
      console.log('Falling back to the fallback model for generating chat title.');
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
