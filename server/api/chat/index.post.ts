import { defineLazyEventHandler } from 'h3';
import { streamText, smoothStream, convertToCoreMessages, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ID } from 'node-appwrite';
import { databases } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { Query } from 'node-appwrite';

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
    deviceId: z.string().optional(),
});

export default defineLazyEventHandler(async () => {
    const model = google('gemini-2.0-flash');

    return defineEventHandler(async (event) => {
        try {
            // console.log('Chat request received', event);
            const session = event.context.session;
            const isAuthenticated = !!session?.userId;
            const userId = session?.userId;

            const body = await readBody(event);
            const validation = chatInputSchema.safeParse(body);

            if (!validation.success) {
                throw createAppError(ErrorCode.INVALID_REQUEST, `Invalid input: ${validation.error.errors[0]?.message}`);
            }

            const { messages, id: chatId, deviceId } = validation.data;
            const lastMessage = messages[messages.length - 1];
            let chatSession;

            if (isAuthenticated) {
                if (!chatId) {
                    throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required for authenticated users');
                }

                // Use Appwrite's query capabilities to find the chat
                const chats = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    COLLECTION_NAMES.CHATS,
                    [
                        Query.equal('$id', chatId),
                        Query.equal('userId', userId)
                    ]
                );

                if (chats.documents.length > 0) {
                    chatSession = chats.documents[0];
                } else {
                    // Create new chat if not found
                    const chatTitle = await generateChatTitle({ message: lastMessage });
                    const now = new Date().toISOString();

                    const doc = await databases.createDocument(
                        appwriteConfig.databaseId,
                        COLLECTION_NAMES.CHATS,
                        chatId,
                        {
                            title: chatTitle,
                            visibility: 'private',
                            userId,
                            lastModifiedBy: deviceId || 'server',
                            createdAt: now,
                            updatedAt: now
                        }
                    );

                    chatSession = doc;
                }

                if (lastMessage.role === 'user' && chatSession) {
                    try {
                        // Create user message with optimized attributes
                        const userMessage = await databases.createDocument(
                            appwriteConfig.databaseId,
                            COLLECTION_NAMES.CHAT_MESSAGES,
                            ID.unique(),
                            {
                                chatId: chatSession.$id,
                                role: 'user',
                                content: lastMessage.content,
                                attachments: JSON.stringify(lastMessage.experimental_attachments || []),
                                lastModifiedBy: deviceId || 'server',
                                deleted: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        );

                        // Update chat's lastModifiedBy and updatedAt
                        await databases.updateDocument(
                            appwriteConfig.databaseId,
                            COLLECTION_NAMES.CHATS,
                            chatSession.$id,
                            {
                                lastModifiedBy: deviceId || 'server',
                                updatedAt: new Date().toISOString()
                            }
                        );

                        if (!userMessage || !userMessage.$id) {
                            throw new Error('Failed to create user message');
                        }

                    } catch (messageError) {
                        console.error('Error creating user message:', messageError);
                        throw createAppError(ErrorCode.INTERNAL_ERROR, 'Failed to save user message');
                    }
                }
            } else {
                chatSession = {
                    $id: `temp-${Date.now()}`,
                    userId: 'anonymous',
                    title: 'Temporary Chat',
                    visibility: 'temporary',
                    lastModifiedBy: deviceId || 'anonymous',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }

            const result = await streamText({
                model,
                messages: convertToCoreMessages(messages),
                temperature: 0.7,
                experimental_transform: smoothStream({
                    chunking: 'word',
                    delayInMs: 1,
                }),
                // Streaming callback
                tools: {
                    web_search: tool({
                        description: 'Search the web for information with 5-10 queries, max results and search depth.',
                        parameters: z.object({
                            queries: z.array(z.string().describe('Array of search queries to look up on the web. Default is 5 to 10 queries.')),
                            maxResults: z.array(
                                z.number().describe('Array of maximum number of results to return per query. Default is 10.'),
                            ),
                            topics: z.array(
                                z.enum(['general', 'news', 'finance']).describe('Array of topic types to search for. Default is general.'),
                            ),
                            searchDepth: z.array(
                                z.enum(['basic', 'advanced']).describe('Array of search depths to use. Default is basic. Use advanced for more detailed results.'),
                            ),
                            include_domains: z
                                .array(z.string())
                                .describe('A list of domains to include in all search results. Default is an empty list.'),
                            exclude_domains: z
                                .array(z.string())
                                .describe('A list of domains to exclude from all search results. Default is an empty list.'),
                        }),
                        execute: async ({
                            queries,
                            maxResults,
                            topics,
                            searchDepth,
                            include_domains,
                            exclude_domains,
                        }: {
                            queries: string[];
                            maxResults: number[];
                            topics: ('general' | 'news' | 'finance')[];
                            searchDepth: ('basic' | 'advanced')[];
                            include_domains?: string[];
                            exclude_domains?: string[];
                        }) => {

                        }
                    })
                },
                onFinish: async (event) => {
                    const fullAssistantMessage = event.text;
                    if (fullAssistantMessage && isAuthenticated && chatSession) {
                        try {
                            // Create assistant message with optimized attributes
                            await databases.createDocument(
                                appwriteConfig.databaseId,
                                COLLECTION_NAMES.CHAT_MESSAGES,
                                ID.unique(),
                                {
                                    chatId: chatSession.$id,
                                    role: 'assistant',
                                    content: fullAssistantMessage,
                                    attachments: JSON.stringify(lastMessage.experimental_attachments || []),
                                    lastModifiedBy: 'assistant',
                                    deleted: false,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                }
                            );

                            // Update chat's lastModifiedBy and updatedAt
                            await databases.updateDocument(
                                appwriteConfig.databaseId,
                                COLLECTION_NAMES.CHATS,
                                chatSession.$id,
                                {
                                    lastModifiedBy: 'assistant',
                                    updatedAt: new Date().toISOString()
                                }
                            );
                        } catch (error) {
                            console.error('Error creating assistant message:', error);
                        }
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
