import { defineLazyEventHandler } from 'h3';
import { streamText, smoothStream } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { findChatSession, insertChat, insertChatMessage } from '~/server/db/queries';
import { ErrorCode, createAppError } from '~/server/utils/errors';

const chatInputSchema = z.object({
    messages: z.array(
        z.object({
            id: z.string().optional(),
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
            experimental_attachments: z.array(z.any()).optional(),
        }).passthrough()
    ).min(1, 'At least one message is required'),
    id: z.string().optional(),
});

export default defineLazyEventHandler(async () => {
    const model = google('gemini-2.5-flash-preview-04-17');

    return defineEventHandler(async (event) => {
        try {
            // console.log('Chat request received', event);
            const session = event.context.session;
            const isAuthenticated = !!session?.userId;
            const userId = session?.userId;

            const body = await readBody(event);
            console.log('Request body:', body);

            const validation = chatInputSchema.safeParse(body);

            if (!validation.success) {
                throw createAppError(ErrorCode.INVALID_REQUEST, `Invalid input: ${validation.error.errors[0]?.message}`);
            }

            const { messages, id: chatId } = validation.data;
            const lastMessage = messages[messages.length - 1];
            let chatSession;

            if (isAuthenticated) {
                if (!chatId) {
                    throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required for authenticated users');
                }

                chatSession = await findChatSession(chatId, userId);

                if (!chatSession) {
                    const chatTitle = await generateChatTitle({ message: lastMessage });
                    if (!lastMessage.id) lastMessage.id = uuidv4();

                    chatSession = {
                        id: chatId,
                        userId,
                        title: chatTitle,
                        visibility: 'private',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    await insertChat(chatSession);
                }

                if (lastMessage.role === 'user') {
                    await insertChatMessage({
                        id: uuidv4(),
                        chatId: chatSession.id,
                        role: 'user',
                        content: lastMessage.content,
                        attachments: lastMessage.experimental_attachments ?? [],
                        createdAt: new Date().toISOString()
                    });
                }
            } else {
                chatSession = {
                    id: `temp-${Date.now()}`,
                    userId: null,
                    title: 'Temporary Chat',
                    visibility: 'temporary',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }

            const result = await streamText({
                model,
                messages,
                temperature: 0.7,
                experimental_transform: smoothStream({
                    chunking: 'word',
                    delayInMs: 1,
                }),
                // Streaming callback
                onFinish: async (event) => {
                    const fullAssistantMessage = event.text;
                    if (fullAssistantMessage && isAuthenticated) {
                        await insertChatMessage({
                            id: uuidv4(),
                            chatId: chatSession.id,
                            role: 'assistant',
                            content: fullAssistantMessage,
                            attachments: lastMessage.experimental_attachments ?? [],
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            });

            // Return streamed response to client
            return result.toDataStreamResponse();

        } catch (error) {
            console.error('Chat error:', error);

            return new Response(JSON.stringify({
                error: error instanceof Error ? error.message : 'An error occurred'
            }), {
                status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    });
});
