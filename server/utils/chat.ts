import { generateText, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { cerebras } from '@ai-sdk/cerebras';

export async function generateChatTitle({
  message,
  model = cerebras('llama3.1-8b'),
}: {
  message: UIMessage | any;
  model?: any;
}) {
  const { text: title } = await generateText({
    model,
    system: `You are our title maker assistant at tezz chat that generates concise and descriptive titles for chat conversations.
    - Generate a short title based on the user's first message (maximum 80 characters)
    - The title should be a clear summary of the main topic or question
    - Make it attractive and engaging
    - Do not include quotes, colons, or special characters
    - Keep it simple and easy to understand`,
    prompt: message.content,
    temperature: 0.7,
  });

  return title;
}
