import { z } from 'zod';
import { Query } from 'node-appwrite';
import { createSessionClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import type { Chat } from '~/server/appwrite/types';

// Input validation schema
const visibilitySchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  visibility: z.enum(['private', 'public'], {
    errorMap: () => ({ message: 'Visibility must be either "private" or "public"' }),
  }),
});

export default defineEventHandler(async event => {
  try {
    const { databases } = createSessionClient(event);
    const session = event.context.session;
    if (!session?.userId) {
      throw createAppError(
        ErrorCode.UNAUTHORIZED,
        'You must be logged in to change chat visibility'
      );
    }

    const body = await readBody(event);
    const validation = visibilitySchema.safeParse(body);

    if (!validation.success) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        `Invalid input: ${validation.error.errors[0]?.message}`
      );
    }

    const { chatId, visibility } = validation.data;

    // Update chat visibility
    const updatedChat = await databases.updateDocument<Chat>(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      chatId,
      {
        visibility,
        lastModifiedBy: session.userId,
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
      data: {
        id: updatedChat.$id,
        visibility: updatedChat.visibility,
        updatedAt: updatedChat.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error updating chat visibility:', error);

    if (error instanceof Error) {
      return {
        success: false,
        error: {
          code: error.message.includes('Unauthorized')
            ? ErrorCode.UNAUTHORIZED
            : ErrorCode.INTERNAL_ERROR,
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An error occurred while updating chat visibility',
      },
    };
  }
});
