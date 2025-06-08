import { defineLazyEventHandler } from 'h3';
import { streamText, generateText, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { chat, chatMessage } from '~/server/db/schema';
import { db } from '~/server/db';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { ErrorCode, createAppError } from '~/server/utils/errors';

const chatInputSchema = z.object({
    messages: z.array(
        z.object({
            id: z.string().optional(),
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
        }).passthrough()
    ).min(1, 'At least one message is required'),
    chatId: z.string().optional(), // Only required for authenticated users
});

export default defineLazyEventHandler(async () => {
    const model = google('gemini-2.5-flash-preview-04-17');

    return defineEventHandler(async (event) => {
        try {
            const session = event.context.session;
            const isAuthenticated = !!session?.userId;
            const userId = session?.userId;

            const body = await readBody(event);

            console.log("Body", body);

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
                chatSession = await db.query.chat.findFirst({
                    where: and(
                        eq(chat.id, chatId),
                        eq(chat.userId, userId)
                    )
                });

                if (!chatSession) {
                    // Create new chat for authenticated user
                    const chatTitle = await generateChatTitle({
                        message: lastMessage,
                    });

                    chatSession = {
                        id: chatId,
                        userId: userId,
                        title: chatTitle,
                        visibility: 'private',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    await db.insert(chat).values(chatSession);
                }
                
                // Store user message for authenticated users
                if (lastMessage.role === 'user') {
                    await db.insert(chatMessage).values({
                        id: uuidv4(),
                        chatId: chatSession.id,
                        role: 'user',
                        content: lastMessage.content,
                        createdAt: new Date()
                    });
                }
            } else {
                // For unauthenticated users, don't require or use chatId
                chatSession = {
                    id: `temp-${Date.now()}`,
                    userId: null,
                    title: 'Temporary Chat',
                    visibility: 'temporary',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }

            const result = streamText({
                model,
                messages,
                temperature: 0.7,
                maxTokens: 2000
            });

            const response = result.toDataStreamResponse();

            const [stream1, stream2] = response.body.tee();

            const responseToSend = new Response(stream1, {
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
                        await db.insert(chatMessage).values({
                            id: uuidv4(),
                            chatId: chatSession.id,
                            role: 'assistant',
                            content: assistantResponse,
                            createdAt: new Date()
                        });
                    }
                } catch (error) {
                    console.error('Error processing stream:', error);
                }
            };

            processStream();

            return responseToSend;

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
