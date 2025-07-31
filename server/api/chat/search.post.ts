import { z } from 'zod';
import { createJWTClient, createSessionClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import type { Chat } from '~/server/appwrite/types';
import { Query } from 'node-appwrite';

// Input validation schema
const searchSchema = z.object({
  searchTerm: z.string().min(1, 'Search term is required'),
});

export default defineEventHandler(async event => {
  try {
    const { databases } = createJWTClient(event);
    const session = event.context.session;
    if (!session?.userId) {
      throw createAppError(
        ErrorCode.UNAUTHORIZED,
        'You must be logged in to change chat visibility'
      );
    }

    const body = await readBody(event);
    console.log('Request body:', body);
    const validation = searchSchema.safeParse(body);

    if (!validation.success) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        `Invalid input: ${validation.error.errors[0]?.message}`
      );
    }

    const { searchTerm } = validation.data;

    // Search chats
    const searchResults = await databases.listDocuments<Chat>(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      [Query.contains('content', searchTerm)]
    );
    console.log('Search results:', searchResults);

    return {
      success: true,
      data: {
        results: searchResults.documents.map(message => ({
          id: message.$id,
          title: message.chatId.title as string,
          content: message.content as string,
          chatId: message.chatId.$id as string,
          updatedAt: message.updatedAt,
          visibility: message.visibility,
        })),
      },
    };
  } catch (error) {
    console.error('Error getting chat messages:', error);

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
        message: 'An error occurred while searching chat messages for the given terms',
      },
    };
  }
});
