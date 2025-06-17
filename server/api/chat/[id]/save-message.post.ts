import { Databases, ID, Permission, Role } from 'node-appwrite';
import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';

const DB_OPERATION_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  timeout = DB_OPERATION_TIMEOUT
): Promise<T> => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeout);
    });
    return (await Promise.race([operation(), timeoutPromise])) as T;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation, ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(operation, retries - 1, timeout);
    }
    throw error;
  }
};

const createMessageDocument = async (
  databases: Databases,
  chatId: string,
  message: any,
  userId: string,
  deviceId: string
) => {
  const messageId = ID.unique();
  const now = new Date().toISOString();

  return await withRetry(() =>
    databases.createDocument(
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
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    )
  );
};

const updateChatDocument = async (databases: Databases, chatId: string, updates: any) => {
  return await withRetry(() =>
    databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  );
};

export default defineEventHandler(async event => {
  try {
    const { databases } = createJWTClient(event);
    const userId = event.context.session?.userId;

    if (!userId) {
      throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
    }

    const chatId = event.context.params?.id;
    if (!chatId) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required');
    }

    const body = await readBody(event);
    const { message, deviceId } = body;

    if (!message) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'Message is required');
    }

    // Save the message
    const savedMessage = await createMessageDocument(
      databases,
      chatId,
      message,
      userId,
      deviceId || 'server'
    );

    // Update chat document
    await updateChatDocument(databases, chatId, {
      lastModifiedBy: deviceId || 'server',
    });

    return {
      success: true,
      message: savedMessage,
    };
  } catch (error) {
    console.error('Error saving message:', error);
    throw createAppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to save message'
    );
  }
});
