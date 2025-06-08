import { generateText, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';


export async function generateChatTitle({
  message,
  model = google('gemini-2.5-flash-preview-04-17')
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