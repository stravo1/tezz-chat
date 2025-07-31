import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';

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

    // Get the request body
    const body = await readBody(event);
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        'Chat name is required and must be a non-empty string'
      );
    }

    // Validate name length (optional: add reasonable limits)
    if (name.trim().length > 100) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat name must be 100 characters or less');
    }

    // Update the chat with new name
    const updatedChat = await databases.updateDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      chatId,
      {
        title: name.trim(),
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
      message: 'Chat renamed successfully',
      data: {
        id: updatedChat.$id,
        name: updatedChat.name,
        updatedAt: updatedChat.updatedAt,
      },
    };
  } catch (error) {
    console.error('Rename chat error:', error);
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
