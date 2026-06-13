import { defineLazyEventHandler } from 'h3';
import { streamText, smoothStream, stepCountIs, convertToModelMessages, type UIMessage } from 'ai';
import { z } from 'zod';
import { Databases, ID } from 'node-appwrite';
import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import {
  doesSupportToolCalls,
  getModel,
  supportedModels,
  type ModelType,
} from '~/server/utils/model';
import { google } from '@ai-sdk/google';
import { generateChatTitle } from '~/server/utils/chat';

// Modular helpers
import {
  createMessageDocument,
  updateChatDocument,
  createPermissions,
  createTimestamp,
  type ChatSession,
} from './lib/db';
import { createOnFinishHandler, generateMessageId } from './lib/stream';
import { buildTools } from './tools';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TEMPERATURE = 0.7;
const MAX_RETRIES = 5;
const MAX_STEPS = 5;
const STREAM_DELAY_MS = 1;

// ─── Input schema ────────────────────────────────────────────────────────────

const chatInputSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  id: z.string().optional(),
  deviceId: z.string().optional(),
  timezone: z.string(),
  intent: z.enum(['text', 'image', 'search']).default('text'),
  isEdited: z.boolean().optional(),
  editedFrom: z.string().optional(),
  editedFromId: z.string().optional(),
  model: z.enum(supportedModels as [string, ...string[]]).default('gemini-3-flash-preview'),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export default defineLazyEventHandler(async () => {
  return defineEventHandler(async event => {
    try {
      const { databases } = createJWTClient(event) as { databases: Databases };
      const userId = event.context.session?.userId as string | undefined;

      if (!userId) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
      }

      const body = await readBody(event);

      // Optional BYOK API keys from request headers
      const headers = getRequestHeaders(event);
      const geminiApiKey = headers['x-gemini-api-key'];
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

      // Abort stream when the client disconnects
      const controller = new AbortController();
      try {
        event.node.req.socket.on('close', () => {
          console.log('Request closed, aborting stream');
          controller.abort();
        });
      } catch (err) {
        console.error('Error setting up close listener:', err);
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
        timezone,
      } = validation.data;

      const modelInstance = getModel(model as ModelType, { geminiApiKey, openRouterApiKey });
      const processedMessages = messages as UIMessage[];
      const lastMessage = processedMessages[processedMessages.length - 1] as UIMessage;
      if (!lastMessage) {
        throw createAppError(ErrorCode.INVALID_REQUEST, 'No messages provided');
      }
      const isEditOperation = !!(isEdited && editedFrom);

      // ── Resolve / create chat session ──────────────────────────────────────
      let chatSession: ChatSession | null = null;

      if (!chatId) {
        throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required');
      }

      try {
        chatSession = (await databases.getDocument(
          appwriteConfig.databaseId,
          COLLECTION_NAMES.CHATS,
          chatId
        )) as ChatSession;

        // Persist the incoming user message (skip for edits — handled in onFinish)
        if (lastMessage.role === 'user' && !isEditOperation) {
          const userMessage = await createMessageDocument(
            databases,
            chatSession.$id,
            lastMessage,
            userId,
            deviceId ?? 'server',
            lastMessage.id ?? null
          );
          if (!userMessage?.$id) throw new Error('Failed to create user message');
          await updateChatDocument(databases, chatSession.$id, {
            lastModifiedBy: deviceId ?? 'server',
          });
        }
      } catch (err) {
        // Chat doesn't exist yet — create it along with the first user message
        const chatTitle = await generateChatTitle({
          message: lastMessage,
          fallbackModel: modelInstance,
        });
        const now = createTimestamp();

        chatSession = (await databases.createDocument(
          appwriteConfig.databaseId,
          COLLECTION_NAMES.CHATS,
          chatId,
          {
            title: chatTitle,
            visibility: 'private',
            lastModifiedBy: deviceId ?? 'server',
            createdAt: now,
            updatedAt: now,
          },
          createPermissions(userId)
        )) as ChatSession;

        const userMessage = await createMessageDocument(
          databases,
          chatSession.$id,
          lastMessage,
          userId,
          deviceId ?? 'server',
          lastMessage.id ?? null
        );
        if (!userMessage?.$id) throw new Error('Failed to create user message');

        await updateChatDocument(databases, chatSession.$id, {
          lastModifiedBy: deviceId ?? 'server',
        });
      }

      // ── Shared onFinish context ────────────────────────────────────────────
      const finishCtx = {
        databases,
        chatSession,
        userId,
        isEditOperation,
        editedFrom,
        chatId,
        editedFromId,
        lastMessage,
      };

      // ── Image generation intent ────────────────────────────────────────────
      if (intent === 'image') {
        const result = streamText({
          model: google('gemini-3-flash-preview'),
          messages: await convertToModelMessages(processedMessages),
          temperature: DEFAULT_TEMPERATURE,
          experimental_transform: smoothStream({ chunking: 'word', delayInMs: STREAM_DELAY_MS }),
          stopWhen: stepCountIs(MAX_STEPS),
          maxRetries: MAX_RETRIES,
          providerOptions: {
            google: { responseModalities: ['TEXT', 'IMAGE'] },
          },
          onError: ({ error }) => console.error('Image generation error:', error),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: processedMessages,
          generateMessageId,
          sendReasoning: true,
          onFinish: createOnFinishHandler(finishCtx),
        });
      }

      // ── Text / search intent ───────────────────────────────────────────────
      const tools = buildTools(model as ModelType, { userTimezone: timezone });

      const result = streamText({
        model: modelInstance,
        messages: await convertToModelMessages(processedMessages),
        temperature: DEFAULT_TEMPERATURE,
        system: `
## About You
Your name is 'tezz.chat' powered by ${model}. Tezz is an Indian word meaning fast. You are not affiliated with any brand or company.
You are an expert in various scientific disciplines including physics, chemistry, biology, computer science, and coding.

## Tools
You have access to: 'web_search' (general up-to-date info), 'news_search' (recent/time-sensitive news), and 'fetch_url' (read the full content of a specific page). Use them ONLY when needed — reply from your own knowledge otherwise.

## Citations
When you use information from search/news results, cite the source inline using bracketed numbers like [1], [2] that correspond to the order of the results returned by the tool. Place the citation right after the relevant claim. Do not invent citation numbers that don't map to a returned result.

## Formatting
- Output in markdown format. LaTeX is supported.
- Inline math: Use $$like this$$ for inline LaTeX. Prefer this format.
- Block math: Use \\[ \\] or \\( \\) for block LaTeX equations.
- No need to tell the user you are using markdown or LaTeX.
        `.trim(),
        stopWhen: stepCountIs(MAX_STEPS),
        maxRetries: MAX_RETRIES,
        abortSignal: controller.signal,
        tools,
        toolChoice: doesSupportToolCalls(model as ModelType) ? 'auto' : undefined,
        providerOptions: {
          openrouter: {
            plugins: [
              {
                id: 'file-parser',
                pdf: { engine: 'pdf-text' },
              },
            ],
          },
        },
        onChunk: ({ chunk }) => {
          if (chunk.type === 'tool-call') console.log('Called tool:', chunk.toolName);
        },
        onStepFinish: ({ warnings }) => {
          if (warnings?.length) console.log('Warnings:', warnings);
        },
        onError: ({ error }) => console.error('Chat stream error:', error),
      });

      return result.toUIMessageStreamResponse({
        originalMessages: processedMessages,
        generateMessageId,
        sendReasoning: true,
        onFinish: createOnFinishHandler(finishCtx),
      });
    } catch (error) {
      console.error('Chat handler error:', error);
      const isUnauth =
        error instanceof Error && error.message.toLowerCase().includes('unauthorized');
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
        {
          status: isUnauth ? 401 : 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });
});
