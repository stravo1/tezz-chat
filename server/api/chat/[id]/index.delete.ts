import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { Query } from 'node-appwrite';

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

    // Soft delete the chat
    await databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
      deleted: true,
      updatedAt: new Date().toISOString(),
    });

    // Get all messages in the chat
    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      [Query.equal('chatId', chatId)]
    );

    // Delete all messages
    await Promise.all(
      messages.documents.map(message =>
        databases.deleteDocument(
          appwriteConfig.databaseId,
          COLLECTION_NAMES.CHAT_MESSAGES,
          message.$id
        )
      )
    );

    return {
      success: true,
      message: 'Chat and messages deleted successfully',
    };
  } catch (error) {
    console.error('Delete chat error:', error);
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
