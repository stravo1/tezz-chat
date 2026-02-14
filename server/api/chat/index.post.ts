import { defineLazyEventHandler } from 'h3';
import { streamText, smoothStream, tool, stepCountIs, convertToModelMessages, UIMessage } from 'ai';
import { z } from 'zod';
import { Databases, ID, Permission, Role } from 'node-appwrite';
import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { Query } from 'node-appwrite';
import {
  doesSupportToolCalls,
  getModel,
  supportedModels,
  type ModelType,
} from '~/server/utils/model';
import { google } from '@ai-sdk/google';
import { withRetry } from '~/server/utils/db';

// Constants
const DEFAULT_TEMPERATURE = 0.7;
const MAX_RETRIES = 5;
const MAX_STEPS = 5;
const STREAM_DELAY_MS = 1;
const DB_OPERATION_TIMEOUT = 10000; // 10 seconds

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

// Schema validation - Using passthrough to accept UIMessage format from AI SDK
const chatInputSchema = z.object({
  messages: z
    .array(z.any()) // Accept any UIMessage format from @ai-sdk/vue Chat class
    .min(1, 'At least one message is required'),
  id: z.string().optional(),
  deviceId: z.string().optional(),
  timezone: z.string(),
  intent: z.enum(['text', 'image', 'search']).default('text'),
  isEdited: z.boolean().optional(),
  editedFrom: z.string().optional(),
  editedFromId: z.string().optional(),
  model: z.enum(supportedModels as [string, ...string[]]).default('gemini-3-flash-preview'),
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

interface ChatMessage {
  role: string;
  content: string;
  parts?: any[];
  isEdited?: boolean;
  editedFrom?: string;
  editedFromId?: string;
}

interface ChatSession {
  $id: string;
  [key: string]: any;
}

interface ChatMessageDocument {
  $id: string;
  [key: string]: any;
}

// Helper functions
const createTimestamp = () => new Date().toISOString();

/**
 * Extracts text content from a UIMessage, handling the parts array format
 */
const getMessageContent = (message: UIMessage): string => {
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
    return textParts || '';
  }
  return '';
};

/**
 * Extracts file parts from a UIMessage parts array
 */
const getFileParts = (message: UIMessage): any[] => {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts.filter((part: any) => part.type === 'file');
  }
  return [];
};

const createPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const createMessageDocument = async (
  databases: any,
  chatId: string,
  message: ChatMessage | UIMessage,
  userId: string,
  deviceId: string,
  messageIdFromMessage: string | null = null
): Promise<ChatMessageDocument> => {
  const messageId = messageIdFromMessage ? messageIdFromMessage : ID.unique();
  const now = createTimestamp();
  // Extract content from message - for UIMessage use parts, for ChatMessage use content
  const content =
    'content' in message && message.content
      ? message.content
      : getMessageContent(message as UIMessage);
  // Extract file parts from the message parts array
  const fileParts = getFileParts(message as UIMessage);

  return (await withRetry(() =>
    databases.createDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      messageId,
      {
        chatId,
        role: message.role,
        content: content,
        parts: JSON.stringify(message.parts || null),
        attachments: JSON.stringify(fileParts),
        lastModifiedBy: deviceId || 'server',
        deleted: false,
        createdAt: now,
        updatedAt: now,
      },
      createPermissions(userId)
    )
  )) as ChatMessageDocument;
};

const updateChatDocument = async (databases: any, chatId: string, updates: any) => {
  return await withRetry(() =>
    databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
      ...updates,
      updatedAt: createTimestamp(),
    })
  );
};

const handleAfterEditDeletion = async (
  databases: Databases,
  chatId: string,
  editedFrom: string,
  lastMessage: UIMessage,
  editedFromId: string
) => {
  try {
    const messagebeingEdited = await withRetry(() =>
      databases.getDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHAT_MESSAGES, editedFromId)
    );

    const messagesToUpdate = await withRetry(() =>
      databases.listDocuments(appwriteConfig.databaseId, COLLECTION_NAMES.CHAT_MESSAGES, [
        Query.equal('chatId', chatId),
        Query.greaterThan('createdAt', messagebeingEdited.createdAt),
      ])
    );

    if (messagebeingEdited) {
      await withRetry(() =>
        databases.updateDocument(
          appwriteConfig.databaseId,
          COLLECTION_NAMES.CHAT_MESSAGES,
          editedFromId,
          {
            content: getMessageContent(lastMessage),
            parts: JSON.stringify(lastMessage.parts || []),
            updatedAt: createTimestamp(),
          }
        )
      );
    }

    await Promise.all(
      messagesToUpdate.documents.map(message =>
        withRetry(() =>
          databases.deleteDocument(
            appwriteConfig.databaseId,
            COLLECTION_NAMES.CHAT_MESSAGES,
            message.$id
          )
        )
      )
    );
  } catch (error) {
    console.error('Error in handleAfterEditDeletion:', error);
    throw error;
  }
};

export default defineLazyEventHandler(async () => {
  // const model = google("");
  // const openrouter = createOpenRouter({
  //   apiKey: process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
  // });
  // const model = openrouter.chat('deepseek/deepseek-chat-v3-0324:free');

  // const model = google('gemini-2.0-flash-exp');

  return defineEventHandler(async event => {
    try {
      const { databases } = createJWTClient(event);
      const userId = event.context.session?.userId;
      console.log({ event });

      if (!userId) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
      }

      const body = await readBody(event);
      // console.log('Received body:', body);

      // Get API keys from headers if provided
      const headers = getRequestHeaders(event);
      const geminiApiKey = headers['x-gemini-api-key'];
      console.log('========Gemini API Key=========' + geminiApiKey);
      const openRouterApiKey = headers['x-openrouter-api-key'];

      console.log('API Keys from headers:', {
        hasGeminiKey: !!geminiApiKey,
        hasOpenRouterKey: !!openRouterApiKey,
      });

      const validation = chatInputSchema.safeParse(body);
      if (!validation.success) {
        throw createAppError(
          ErrorCode.INVALID_REQUEST,
          `Invalid input: ${validation.error.errors[0]?.message}`
        );
      }
      const controller = new AbortController();
      try {
        event.node.req.socket.on('close', () => {
          console.log('Request closed, aborting stream');
          controller.abort();
          // Handle request close event if needed
        });
      } catch (error) {
        console.error('Error setting up request close listener:', error);
        console.log('Continuing without request close listener', event);
      }

      const {
        messages,
        id: chatId,
        deviceId,
        isEdited,
        editedFrom,
        intent,
        model,
        editedFromId,
      } = validation.data;
      const modelInstance = getModel(model as ModelType, {
        geminiApiKey: geminiApiKey,
        openRouterApiKey: openRouterApiKey,
      });
      // Preprocess messages to ensure file attachments are properly included in parts
      const processedMessages = messages.map((msg: any) => {
        // If message has experimental_attachments but they're not in parts, add them
        if (msg.experimental_attachments && Array.isArray(msg.experimental_attachments)) {
          const existingParts = msg.parts || [];
          const existingFileUrls = existingParts
            .filter((p: any) => p.type === 'file')
            .map((p: any) => p.url);

          const newFileParts = msg.experimental_attachments
            .filter((att: any) => !existingFileUrls.includes(att.url))
            .map((att: any) => ({
              type: 'file',
              url: att.url,
              filename: att.name || att.filename,
              mediaType: att.contentType || att.mediaType || 'application/octet-stream',
            }));

          return {
            ...msg,
            parts: [...existingParts, ...newFileParts],
          };
        }
        return msg;
      });

      const lastMessage = processedMessages[processedMessages.length - 1] as UIMessage;
      console.log('Last message:', lastMessage);
      let chatSession: ChatSession | null;
      const isEditOperation = isEdited && editedFrom;

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

          if (lastMessage.role === 'user' && chatSession && !isEditOperation) {
            try {
              const userMessage = await createMessageDocument(
                databases,
                chatSession.$id,
                lastMessage,
                userId,
                deviceId || 'server',
                lastMessage.id || null
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
          const chatTitle = await generateChatTitle({
            message: lastMessage,
            fallbackModel: modelInstance,
          });
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
          // create user message
          const userMessage = await createMessageDocument(
            databases,
            chatSession.$id,
            lastMessage,
            userId,
            deviceId || 'server',
            lastMessage.id || null
          );
          if (!userMessage || !userMessage.$id) {
            throw new Error('Failed to create user message');
          }
          await updateChatDocument(databases, chatSession.$id, {
            lastModifiedBy: deviceId || 'server',
          });
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

      if (intent === 'image') {
        const result = streamText({
          // model: modelInstance,
          messages: await convertToModelMessages(processedMessages as UIMessage[]),
          temperature: DEFAULT_TEMPERATURE,
          experimental_transform: smoothStream({
            chunking: 'word',
            delayInMs: STREAM_DELAY_MS,
          }),
          stopWhen: stepCountIs(MAX_STEPS),
          maxRetries: MAX_RETRIES,
          model: google('gemini-3-flash-preview'),
          providerOptions: {
            google: { responseModalities: ['TEXT', 'IMAGE'] },
          },
          onFinish: async event => {
            console.log('Image generation finished:', event.response.messages);
            if (event.text && userId && chatSession) {
              try {
                // Check if the response contains image data
                const imageData = event.files?.[0] as
                  | { base64: string; mimeType?: string; mediaType?: string }
                  | undefined;
                const imageMimeType = imageData?.mimeType || imageData?.mediaType || 'image/png';
                const messageData: ChatMessage = {
                  role: 'assistant',
                  content: event.text,
                  parts: imageData
                    ? [
                        {
                          type: 'text',
                          text: event.text,
                        },
                        { type: 'file', mimeType: imageMimeType, data: imageData.base64 },
                      ]
                    : [
                        {
                          type: 'text',
                          text: event.text,
                        },
                      ],
                };
                if (isEditOperation && editedFrom && chatId && editedFromId) {
                  await handleAfterEditDeletion(
                    databases,
                    chatId,
                    editedFrom,
                    lastMessage,
                    editedFromId
                  );
                  console.log('Handled message editing and deletion successfully');
                }

                await createMessageDocument(
                  databases,
                  chatSession.$id,
                  messageData,
                  userId,
                  'assistant',
                  null
                );
                await updateChatDocument(databases, chatSession.$id, {
                  lastModifiedBy: 'assistant',
                });
              } catch (error) {
                console.error('Error creating image message:', error);
              }
            }
          },
          onError(event) {
            console.error('Image generation error:', event.error);
          },
        });

        return result.toUIMessageStreamResponse({
          generateMessageId: () => ID.unique(),
        });
      }

      const result = streamText({
        model: modelInstance,
        messages: await convertToModelMessages(processedMessages as UIMessage[]),
        temperature: DEFAULT_TEMPERATURE,
        system: `
        ## About You
        Your name is 'tezz.chat' powered by ${model}, tezz is an Indian word meaning fast. You are not affliated with any brand or company.
        You are an expert in various scientific disciplines, including physics, chemistry, and biology, computer science, coding. Use web search ONLY when needed to. Reply normally otherwise.
        ## Formatting
        - You should output in markdown format. LaTeX is also supported!
        - Inline math: Use $$like this$$ for inline LaTeX. Use this format as much as possible.
        - Block math: Use \\[ \\] or \\( \\) for block LaTeX equations
        - No need to tell the user that you are using markdown or LaTeX.
        `,
        // experimental_transform: smoothStream({
        //   chunking: 'word',
        //   delayInMs: STREAM_DELAY_MS,
        // }),
        stopWhen: stepCountIs(MAX_STEPS),
        maxRetries: MAX_RETRIES,
        abortSignal: controller.signal,
        tools: doesSupportToolCalls(model as ModelType)
          ? {
              web_search: tool<
                {
                  query: string;
                  location?: string;
                  gl?: string;
                  num?: number;
                  page?: number;
                },
                {
                  success: boolean;
                  data?: {
                    summary: string;
                    results: string;
                    topStories: string;
                    relatedQuestions: string;
                    totalResults: number;
                  };
                  error?: string;
                }
              >({
                description: 'Search the web for information using Serper API.',
                inputSchema: z.object({
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

                    const response = await $fetch<SerperResponse>(
                      'https://google.serper.dev/search',
                      {
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
                      }
                    );

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
            }
          : undefined,
        toolChoice: doesSupportToolCalls(model as ModelType) ? 'auto' : undefined,
        providerOptions: {
          openrouter: {
            plugins: [
              {
                id: 'file-parser',
                pdf: {
                  engine: 'pdf-text', // defaults to "mistral-ocr". See Pricing above
                },
              },
            ],
          },
        },
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
            console.log('AI response:', event, event.response);
            // Handle message editing after AI response
            if (isEditOperation && editedFrom && chatId && editedFromId) {
              await handleAfterEditDeletion(
                databases,
                chatId,
                editedFrom,
                lastMessage,
                editedFromId
              );
              console.log('Handled message editing and deletion successfully');
            }

            const assistantResponseMessage = event.response.messages.find(
              msg => msg.role === 'assistant'
            );

            try {
              const messageData: ChatMessage = {
                role: 'assistant',
                content: event.text,
                parts: Array.isArray(assistantResponseMessage?.content)
                  ? assistantResponseMessage.content
                  : [{ type: 'text', text: event.text }],
              };

              // Create assistant message and update chat document in parallel
              (await createMessageDocument(
                databases,
                chatSession.$id,
                messageData,
                userId,
                'assistant',
                null
              ),
                await updateChatDocument(databases, chatSession.$id, {
                  lastModifiedBy: 'assistant',
                }));
            } catch (error) {
              console.error('Error creating assistant message:', error);
            }
          }
        },
        onError(event) {
          console.error('Chat error:', event.error);
        },
      });
      // Do NOT call consumeStream() - it consumes the stream before it can be sent to client
      // Just return the stream response directly
      return result.toUIMessageStreamResponse({
        sendReasoning: true,
        generateMessageId: () => ID.unique(),
      });
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
