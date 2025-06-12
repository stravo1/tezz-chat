import { defineLazyEventHandler } from 'h3';
import { streamText, smoothStream, convertToCoreMessages, appendResponseMessages, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ID, Permission, Role } from 'node-appwrite';
import { createJWTClient, createSessionClient } from "~/server/appwrite/config";
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
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
    deviceId: z.string().optional(),
});

function getTrailingMessageId({
    messages,
}: {
    messages: Array<ResponseMessage>;
}): string | null { 
    const trailingMessage = messages.at(-1);

    if (!trailingMessage) return null;

    return trailingMessage.id;
}

export default defineLazyEventHandler(async () => {
    const model = google('gemini-2.0-flash');

    return defineEventHandler(async (event) => {
        try {
            const { databases, account } = createJWTClient(event);
            
            const userId = (await account.get()).$id;

            const body = await readBody(event);
            
            const validation = chatInputSchema.safeParse(body);

            if (!validation.success) {
                throw createAppError(ErrorCode.INVALID_REQUEST, `Invalid input: ${validation.error.errors[0]?.message}`);
            }

            const { messages, id: chatId, deviceId } = validation.data;
            const lastMessage = messages[messages.length - 1];
            let chatSession;

            if (userId) {
                if (!chatId) {
                    throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required for authenticated users');
                }

                try {
                    // Try to get the chat - Appwrite will handle permission checks
                    const chat = await databases.getDocument(
                        appwriteConfig.databaseId,
                        COLLECTION_NAMES.CHATS,
                        chatId
                    );
                    chatSession = chat;
                } catch (error) {
                    // If chat doesn't exist or user doesn't have access, create a new one
                    const chatTitle = await generateChatTitle({ message: lastMessage });
                    const now = new Date().toISOString();

                    const doc = await databases.createDocument(
                        appwriteConfig.databaseId,
                        COLLECTION_NAMES.CHATS,
                        chatId,
                        {
                            title: chatTitle,
                            visibility: 'private',
                            lastModifiedBy: deviceId || 'server',
                            createdAt: now,
                            updatedAt: now
                        },
                        [
                            Permission.read(Role.user(userId)),
                            Permission.update(Role.user(userId)),
                            Permission.delete(Role.user(userId))
                        ]
                    );

                    chatSession = doc;
                }

                if (lastMessage.role === 'user' && chatSession) {
                    try {
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
                            },
                            [
                                Permission.read(Role.user(userId)),
                                Permission.update(Role.user(userId)),
                                Permission.delete(Role.user(userId))
                            ]
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
                maxSteps: 5,
                maxRetries: 5,
                tools: {
                    web_search: tool({
                        description: 'Search the web for information using Serper API.',
                        parameters: z.object({
                            query: z.string().describe('The search query to look up on the web.'),
                            location: z.string().optional().describe('Location for localized results (e.g., "India").'),
                            gl: z.string().optional().describe('Google country code (e.g., "in" for India).'),
                            num: z.number().optional().describe('Number of results to return (default: 10, max: 20).'),
                            page: z.number().optional().describe('Page number for pagination (default: 1).'),
                        }),
                        execute: async ({
                            query,
                            location,
                            gl,
                            num = 30,
                            page,
                        }) => {
                            console.log('--------------Web Search');
                            console.log(query);
                            console.log('------------------------');
                            try {
                                const response = await $fetch('https://google.serper.dev/search', {
                                    method: 'POST',
                                    headers: {
                                        'X-API-KEY': process.env.NUXT_SERPR_API_KEY as string,
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        q: query,
                                        location,
                                        gl,
                                        num: Math.min(num, 30),
                                        page
                                    }
                                }) as {
                                    searchParameters: {
                                        q: string;
                                        gl: string;
                                        type: string;
                                        num: number;
                                        page: number;
                                    };
                                    knowledgeGraph?: {
                                        title: string;
                                        type: string;
                                        website: string;
                                        imageUrl: string;
                                        description: string;
                                        descriptionSource: string;
                                        descriptionLink: string;
                                        attributes: Record<string, string>;
                                    };
                                    organic: Array<{
                                        title: string;
                                        link: string;
                                        snippet: string;
                                        date?: string;
                                        attributes?: Record<string, string>;
                                        sitelinks?: Array<{
                                            title: string;
                                            link: string;
                                        }>;
                                        position: number;
                                    }>;
                                    peopleAlsoAsk?: Array<{
                                        question: string;
                                        snippet: string;
                                        title: string;
                                        link: string;
                                    }>;
                                    relatedSearches?: Array<{
                                        query: string;
                                    }>;
                                };

                                const searchResults = {
                                    summary: response.knowledgeGraph?.description || '',
                                    organic: response.organic?.map((result) => ({
                                        title: result.title,
                                        link: result.link,
                                        snippet: result.snippet,
                                        date: result.date || ''
                                    })) || [],
                                    topStories: response.organic?.filter(result => result.date)?.map(story => ({
                                        title: story.title,
                                        source: story.link,
                                        date: story.date
                                    })) || [],
                                    peopleAlsoAsk: response.peopleAlsoAsk?.map(qa => ({
                                        question: qa.question,
                                        answer: qa.snippet
                                    })) || [],
                                    totalResults: response.organic?.length || 0
                                };

                                const formattedResponse = {
                                    success: true,
                                    data: {
                                        summary: searchResults.summary,
                                        results: searchResults.organic.slice(0, 3).map(result => 
                                            `Title: ${result.title}\nLink: ${result.link}\nSnippet: ${result.snippet}${result.date ? `\nDate: ${result.date}` : ''}`
                                        ).join('\n\n'),
                                        topStories: searchResults.topStories.slice(0, 2).map(story => 
                                            `Title: ${story.title}\nSource: ${story.source}\nDate: ${story.date}`
                                        ).join('\n\n'),
                                        relatedQuestions: searchResults.peopleAlsoAsk.slice(0, 2).map(qa => 
                                            `Q: ${qa.question}\nA: ${qa.answer}`
                                        ).join('\n\n'),
                                        totalResults: searchResults.totalResults
                                    }
                                };

                                return formattedResponse;
                            } catch (error) {
                                console.error('Serper search error:', error);
                                return {
                                    success: false,
                                    error: 'Failed to perform web search'
                                };
                            }
                        }
                    })
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
                onFinish: async (event) => {
                    console.log('Chat finished successfully', JSON.stringify(event));
                    console.log('Fin reason: ', event.finishReason);
                    console.log('Reasoning: ', event.reasoning);
                    console.log('reasoning details: ', event.reasoningDetails);
                    console.log('Steps: ', event.steps);
                    console.log('Messages: ', event.response.messages);
                    console.log('Response Body: ', event.response.body);
                    console.log('Provider metadata: ', event.providerMetadata);
                    console.log("Sources: ", event.sources);

                    const fullAssistantMessage = event.text;
                    if (fullAssistantMessage && userId && chatSession) {

                        const assistantId = getTrailingMessageId({
                            messages: event.response.messages.filter(
                                (message: any) => message.role === 'assistant',
                            ),
                        });

                        if (!assistantId) {
                            throw new Error('No assistant message found!');
                        }

                        const [, assistantMessage] = appendResponseMessages({
                            messages: [messages[messages.length - 1]],
                            responseMessages: event.response.messages,
                        });

                        console.log("Assistant message [annotations]:", assistantMessage.annotations);

                        try {
                            // Create assistant message with document-level permissions
                            await databases.createDocument(
                                appwriteConfig.databaseId,
                                COLLECTION_NAMES.CHAT_MESSAGES,
                                ID.unique(),
                                {
                                    chatId: chatSession.$id,
                                    role: assistantMessage.role,
                                    content: fullAssistantMessage,
                                    parts: JSON.stringify(assistantMessage.parts || []),
                                    attachments: JSON.stringify(lastMessage.experimental_attachments || []),
                                    lastModifiedBy: 'assistant',
                                    deleted: false,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                },
                                [
                                    Permission.read(Role.user(userId)),
                                    Permission.update(Role.user(userId)),
                                    Permission.delete(Role.user(userId))
                                ]
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
                },
                onError(event) {
                    console.log('Error: ', event.error);
                },
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
