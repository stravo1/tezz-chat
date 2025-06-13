import { defineLazyEventHandler } from 'h3';
import { streamText, smoothStream, convertToCoreMessages, appendResponseMessages, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { ID, Permission, Role } from 'node-appwrite';
import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { Query } from 'node-appwrite';

// Constants
const DEFAULT_TEMPERATURE = 0.7;
const MAX_RETRIES = 5;
const MAX_STEPS = 5;
const STREAM_DELAY_MS = 1;

// Timezone to country code mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'in',
  'Asia/Dubai': 'ae',
  'Asia/Singapore': 'sg',
  'Asia/Tokyo': 'jp',
  'Asia/Shanghai': 'cn',
  'Europe/London': 'uk',
  'Europe/Paris': 'fr',
  'Europe/Berlin': 'de',
  'America/New_York': 'us',
  'America/Los_Angeles': 'us',
  'America/Chicago': 'us',
  'Australia/Sydney': 'au',
  'Pacific/Auckland': 'nz',
};

// Schema validation
const chatInputSchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string().optional(),
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string(),
          parts: z.array(z.any()).optional(),
          experimental_attachments: z.array(z.any()).optional(),
          isEdited: z.boolean().optional(),
          editedFrom: z.string().optional(),
        })
        .passthrough()
    )
    .min(1, 'At least one message is required'),
  id: z.string().optional(),
  deviceId: z.string().optional(),
  timezone: z.string(),
});

// Types
interface SerperResponse {
  knowledgeGraph?: {
    description?: string;
  };
  organic?: Array<{
    title: string;
    link: string;
    snippet: string;
    date?: string;
  }>;
  peopleAlsoAsk?: Array<{
    question: string;
    snippet: string;
  }>;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: any[];
  experimental_attachments?: any[];
  isEdited?: boolean;
  editedFrom?: string;
}

interface ChatMessage {
  role: string;
  content: string;
  parts?: any[];
  experimental_attachments?: any[];
  isEdited?: boolean;
  editedFrom?: string;
}

// Helper functions
const createTimestamp = () => new Date().toISOString();

const createPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const createMessageDocument = async (
  databases: any,
  chatId: string,
  message: ChatMessage,
  userId: string,
  deviceId: string
) => {
  const messageId = ID.unique();
  const now = createTimestamp();

  return await databases.createDocument(
    appwriteConfig.databaseId,
    COLLECTION_NAMES.CHAT_MESSAGES,
    messageId,
    {
      chatId,
      role: message.role,
      content: message.content,
      parts: JSON.stringify(message.parts || null),
      attachments: JSON.stringify(message.experimental_attachments || []),
      lastModifiedBy: deviceId || 'server',
      deleted: false,
      createdAt: now,
      updatedAt: now,
    },
    createPermissions(userId)
  );
};

const updateChatDocument = async (databases: any, chatId: string, updates: any) => {
  return await databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
    ...updates,
    updatedAt: createTimestamp(),
  });
};

export default defineLazyEventHandler(async () => {
  // const model = google("");
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
  });
  const model = openrouter.chat('meta-llama/llama-4-maverick:free');

  return defineEventHandler(async event => {
    try {
      const { databases } = createJWTClient(event);
      const userId = event.context.session?.userId;

      if (!userId) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
      }

      const body = await readBody(event);

      const validation = chatInputSchema.safeParse(body);
      if (!validation.success) {
        throw createAppError(
          ErrorCode.INVALID_REQUEST,
          `Invalid input: ${validation.error.errors[0]?.message}`
        );
      }

      const { messages, id: chatId, deviceId, timezone } = validation.data;
      const lastMessage = messages[messages.length - 1] as Message;
      let chatSession;
      const isEditOperation = lastMessage.isEdited && lastMessage.editedFrom;

      if (userId) {
        if (!chatId) {
          throw createAppError(
            ErrorCode.INVALID_REQUEST,
            'Chat ID is required for authenticated users'
          );
        }

        try {
          chatSession = await databases.getDocument(
            appwriteConfig.databaseId,
            COLLECTION_NAMES.CHATS,
            chatId
          );

          if (lastMessage.role === 'user' && chatSession) {
            try {
              const userMessage = await createMessageDocument(
                databases,
                chatSession.$id,
                lastMessage,
                userId,
                deviceId || 'server'
              );

              if (!userMessage || !userMessage.$id) {
                throw new Error('Failed to create user message');
              }

              await updateChatDocument(databases, chatSession.$id, {
                lastModifiedBy: deviceId || 'server',
              });
            } catch (messageError) {
              console.error('Error creating user message:', messageError);
              throw createAppError(ErrorCode.INTERNAL_ERROR, 'Failed to save user message');
            }
          }
        } catch (error) {
          const chatTitle = await generateChatTitle({ message: lastMessage });
          const now = createTimestamp();

          chatSession = await databases.createDocument(
            appwriteConfig.databaseId,
            COLLECTION_NAMES.CHATS,
            chatId,
            {
              title: chatTitle,
              visibility: 'private',
              lastModifiedBy: deviceId || 'server',
              createdAt: now,
              updatedAt: now,
            },
            createPermissions(userId)
          );
        }
      } else {
        chatSession = {
          $id: `temp-${Date.now()}`,
          userId: 'anonymous',
          title: 'Temporary Chat',
          visibility: 'temporary',
          lastModifiedBy: deviceId || 'anonymous',
          createdAt: createTimestamp(),
          updatedAt: createTimestamp(),
        };
      }

      const result = streamText({
        model,
        messages: convertToCoreMessages(messages),
        temperature: DEFAULT_TEMPERATURE,
        experimental_transform: smoothStream({
          chunking: 'word',
          delayInMs: STREAM_DELAY_MS,
        }),
        maxSteps: MAX_STEPS,
        maxRetries: MAX_RETRIES,
        tools: {
          web_search: tool({
            description: 'Search the web for information using Serper API.',
            parameters: z.object({
              query: z.string().describe('The search query to look up on the web.'),
              location: z
                .string()
                .optional()
                .describe('Location for localized results (e.g., "India").'),
              gl: z.string().optional().describe('Google country code (e.g., "in" for India).'),
              num: z
                .number()
                .optional()
                .describe('Number of results to return (default: 10, max: 20).'),
              page: z.number().optional().describe('Page number for pagination (default: 1).'),
            }),
            execute: async ({ query, location, gl, num = 30, page }) => {
              try {
                // Get timezone from the request body
                const userTimezone = body.timezone;
                // Get country code from timezone mapping
                const countryCode = TIMEZONE_TO_COUNTRY[userTimezone] || 'in';

                const response = await $fetch<SerperResponse>('https://google.serper.dev/search', {
                  method: 'POST',
                  headers: {
                    'X-API-KEY': process.env.NUXT_SERPR_API_KEY as string,
                    'Content-Type': 'application/json',
                  },
                  body: {
                    q: query,
                    location: location || userTimezone,
                    gl: gl || countryCode,
                    num: Math.min(num, 30),
                    page,
                  },
                });

                const searchResults = {
                  summary: response.knowledgeGraph?.description || '',
                  organic:
                    response.organic?.map(result => ({
                      title: result.title,
                      link: result.link,
                      snippet: result.snippet,
                      date: result.date || '',
                    })) || [],
                  topStories:
                    response.organic
                      ?.filter(result => result.date)
                      ?.map(story => ({
                        title: story.title,
                        source: story.link,
                        date: story.date,
                      })) || [],
                  peopleAlsoAsk:
                    response.peopleAlsoAsk?.map(qa => ({
                      question: qa.question,
                      answer: qa.snippet,
                    })) || [],
                  totalResults: response.organic?.length || 0,
                };

                return {
                  success: true,
                  data: {
                    summary: searchResults.summary,
                    results: searchResults.organic
                      .slice(0, 3)
                      .map(
                        result =>
                          `Title: ${result.title}\nLink: ${result.link}\nSnippet: ${result.snippet}${result.date ? `\nDate: ${result.date}` : ''}`
                      )
                      .join('\n\n'),
                    topStories: searchResults.topStories
                      .slice(0, 2)
                      .map(
                        story =>
                          `Title: ${story.title}\nSource: ${story.source}\nDate: ${story.date}`
                      )
                      .join('\n\n'),
                    relatedQuestions: searchResults.peopleAlsoAsk
                      .slice(0, 2)
                      .map(qa => `Q: ${qa.question}\nA: ${qa.answer}`)
                      .join('\n\n'),
                    totalResults: searchResults.totalResults,
                  },
                };
              } catch (error) {
                console.error('Serper search error:', error);
                return {
                  success: false,
                  error: 'Failed to perform web search',
                };
              }
            },
          }),
        },
        toolChoice: 'auto',
        onChunk(event) {
          if (event.chunk.type === 'tool-call') {
            console.log('Called Tool: ', event.chunk.toolName);
          }
        },
        onStepFinish(event) {
          if (event.warnings) {
            console.log('Warnings: ', event.warnings);
          }
        },
        onFinish: async event => {
          if (event.text && userId && chatSession) {
            // Handle message editing after AI response
            if (isEditOperation && lastMessage.editedFrom && chatId) {
              const messagesToUpdate = await databases.listDocuments(
                appwriteConfig.databaseId,
                COLLECTION_NAMES.CHAT_MESSAGES,
                [
                  Query.equal('chatId', chatId),
                  Query.greaterThan('$createdAt', lastMessage.editedFrom),
                ]
              );

              // Use Promise.all for parallel updates
              await Promise.all(
                messagesToUpdate.documents.map(message =>
                  databases.updateDocument(
                    appwriteConfig.databaseId,
                    COLLECTION_NAMES.CHAT_MESSAGES,
                    message.$id,
                    {
                      deleted: true,
                      updatedAt: createTimestamp(),
                    }
                  )
                )
              );
            }

            const [, assistantMessage] = appendResponseMessages({
              messages: [lastMessage],
              responseMessages: event.response.messages,
            });

            try {
              const messageData: ChatMessage = {
                role: assistantMessage.role === 'data' ? 'assistant' : assistantMessage.role,
                content: event.text,
                parts: assistantMessage.parts || [],
                experimental_attachments: lastMessage.experimental_attachments || [],
              };

              // Create assistant message and update chat document in parallel
              await Promise.all([
                createMessageDocument(databases, chatSession.$id, messageData, userId, 'assistant'),
                updateChatDocument(databases, chatSession.$id, {
                  lastModifiedBy: 'assistant',
                }),
              ]);
            } catch (error) {
              console.error('Error creating assistant message:', error);
            }
          }
        },
        onError(event) {
          console.error('Chat error:', event.error);
        },
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error('Chat error:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'An error occurred',
        }),
        {
          status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });
});
