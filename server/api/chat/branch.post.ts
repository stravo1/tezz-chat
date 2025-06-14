import { defineEventHandler, readBody } from 'h3';
import { ID, Permission, Role, Query } from 'node-appwrite';
import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { z } from 'zod';

// Schema validation
const branchChatSchema = z.object({
  sourceChatId: z.string().describe('ID of the chat to branch from'),
  branchFromTimestamp: z
    .string()
    .describe(
      'ISO timestamp of the message to branch from (messages before this timestamp will be included)'
    ),
  deviceId: z.string().optional().describe('Optional device identifier'),
});

// Helper functions
const createTimestamp = () => new Date().toISOString();

const createPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

export default defineEventHandler(async event => {
  try {
    const { databases } = createJWTClient(event);
    const userId = event.context.session?.userId;

    if (!userId) {
      throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
    }

    const body = await readBody(event);

    console.log('================Body============');
    console.log(body);

    const validation = branchChatSchema.safeParse(body);

    if (!validation.success) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        `Invalid input: ${validation.error.errors[0]?.message}`
      );
    }

    const { sourceChatId, branchFromTimestamp, deviceId } = validation.data;

    // Validate timestamp format
    if (isNaN(Date.parse(branchFromTimestamp))) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        'Invalid timestamp format. Please provide a valid ISO timestamp.'
      );
    }

    // Get the source chat
    const sourceChat = await databases.getDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      sourceChatId,
      [Query.select(['$id', 'title'])]
    );

    console.log('================Source Chat===============');
    console.log(sourceChat);
    console.log('===========================================');

    if (!sourceChat) {
      throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'Source chat not found');
    }

    // Get all messages up to the specified timestamp
    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      [
        Query.equal('chatId', sourceChatId),
        Query.lessThanEqual('$createdAt', branchFromTimestamp),
        Query.equal('deleted', false),
        Query.orderAsc('$createdAt'),
      ]
    );

    console.log(messages.total);
    console.log('=============Messagees==============');
    console.log(messages);
    console.log('=====================================');

    // remove last message if it is from user
    if (
      messages.documents.length > 0 &&
      messages.documents[messages.documents.length - 1].role === 'user'
    ) {
      messages.documents.pop();
    }

    if (!messages.documents.length) {
      throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'No messages found to branch from');
    }

    // Create new chat
    const newChatId = ID.unique();
    const now = createTimestamp();

    // Generate a title for the new branch
    const branchTitle = `${sourceChat.title} (Branch)`;

    // Create new chat document
    const newChat = await databases.createDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      newChatId,
      {
        title: branchTitle,
        visibility: 'private',
        deleted: false,
        lastModifiedBy: deviceId || 'server',
        createdAt: now,
        updatedAt: now,
        sourceChatId: sourceChatId,
        branchedFromTimestamp: branchFromTimestamp,
      },
      createPermissions(userId)
    );

    console.log('=================New Chat================');
    console.log(newChat);
    console.log('================================');

    // Copy messages to the new chat
    const messagePromises = messages.documents.map(message => {
      const newMessageId = ID.unique();
      return databases.createDocument(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        newMessageId,
        {
          chatId: newChatId,
          role: message.role,
          content: message.content,
          parts: message.parts || null,
          attachments: message.attachments || null,
          deleted: false,
          lastModifiedBy: deviceId || 'server',
          createdAt: message.$createdAt,
          updatedAt: now,
        },
        createPermissions(userId)
      );
    });

    await Promise.all(messagePromises);

    return {
      success: true,
      data: {
        chatId: newChatId,
        title: branchTitle,
        messageCount: messages.documents.length,
        sourceChatId: sourceChatId,
        branchedFromTimestamp: branchFromTimestamp,
      },
    };
  } catch (error) {
    console.error('Chat branching error:', error);
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
