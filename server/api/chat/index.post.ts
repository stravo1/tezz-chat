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
    chatId: z.string().optional(),
});

export default defineLazyEventHandler(async () => {
    const model = google('gemini-2.5-flash-preview-04-17');

    return defineEventHandler(async (event) => {
        try {
            const session = event.context.session;
            const isAuthenticated = !!session?.userId;
            const userId = session?.userId;

            const body = await readBody(event);

            const validation = chatInputSchema.safeParse(body);

            if (!validation.success) {
                throw createAppError(ErrorCode.INVALID_REQUEST, `Invalid input: ${validation.error.errors[0]?.message}`);
            }

            const { messages, chatId } = validation.data;
            const lastMessage = messages[messages.length - 1];
            let chatSession;

            if (isAuthenticated) {
                // For authenticated users, chatId is required
                if (!chatId) {
                    throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required for authenticated users');
                }

                // Find or create chat for authenticated user
                chatSession = await findChatSession(chatId, userId);

                if (!chatSession) {
                    // Create new chat for authenticated user
                    const chatTitle = await generateChatTitle({
                        message: lastMessage,
                    });
                    if (!lastMessage.id) {
                        lastMessage.id = uuidv4();
                    }

                    chatSession = {
                        id: chatId,
                        userId: userId,
                        title: chatTitle,
                        visibility: 'private',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    await insertChat(chatSession);
                }

                // Store user message for authenticated users
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
                // For unauthenticated users, don't require or use chatId
                chatSession = {
                    id: `temp-${Date.now()}`,
                    userId: null,
                    title: 'Temporary Chat',
                    visibility: 'temporary',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }

            const result = streamText({
                model,
                messages,
                temperature: 0.7,
                experimental_transform: smoothStream({
                    chunking: 'word',
                    delayInMs: 1,
                }),
                // maxTokens: 2000
            });

            const response = result.toDataStreamResponse();

            let responseToSend: Response;
            if (response.body) {
                const [stream1, stream2] = response.body.tee();

                responseToSend = new Response(stream1, {
                    headers: response.headers
                });

                const reader = stream2.getReader();
                let assistantResponse = '';

                const processStream = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            assistantResponse += new TextDecoder().decode(value);
                        }

                        if (assistantResponse && isAuthenticated) {
                            await insertChatMessage({
                                id: uuidv4(),
                                chatId: chatSession.id,
                                role: 'assistant',
                                content: assistantResponse,
                                attachments: lastMessage.experimental_attachments ?? [],
                                createdAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.error('Error processing stream:', error);
                    }
                }

                processStream();

                return responseToSend;
            }
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
