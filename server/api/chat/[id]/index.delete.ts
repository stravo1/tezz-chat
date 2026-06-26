import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { withRetry } from '~/server/utils/db';
import { materializeLazyBranchesBeforeChatDelete } from '../lib/materializeBranches';

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

    await withRetry(() =>
      databases.getDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId)
    );

    const { materializedBranchCount, materializedMessageCount, messagesToDelete } =
      await materializeLazyBranchesBeforeChatDelete(databases, chatId, userId);

    await databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
      deleted: true,
      updatedAt: new Date().toISOString(),
    });

    await Promise.all(
      messagesToDelete.map(message =>
        withRetry(() =>
          databases.deleteDocument(
            appwriteConfig.databaseId,
            COLLECTION_NAMES.CHAT_MESSAGES,
            message.$id
          )
        )
      )
    );

    return {
      success: true,
      message: 'Chat and messages deleted successfully',
      materializedBranchCount,
      materializedMessageCount,
    };
  } catch (error) {
    console.error('Delete chat error:', error);
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    throw createAppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'An error occurred while deleting chat'
    );
  }
});
