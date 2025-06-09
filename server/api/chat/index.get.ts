import { Query } from 'node-appwrite';
import { databases } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';


// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export default defineEventHandler(async (event) => {
  try {
    // Get the authenticated user from the session
    const session = event.context.session;
    if (!session?.userId) {
      throw createAppError(ErrorCode.UNAUTHORIZED, 'You must be logged in to view chats');
    }

    // Get query parameters with defaults
    const query = getQuery(event);
    const page = query.page ? Math.max(1, parseInt(query.page as string, 10)) : DEFAULT_PAGE;
    const limit = query.limit
      ? Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string, 10)))
      : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    // Fetch paginated chats for the user using Appwrite with selected fields
    const chats = await databases.listDocuments(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      [
        Query.equal('userId', session.userId),
        Query.orderDesc('updatedAt'),
        Query.limit(limit),
        Query.offset(offset),
        // Select only the fields we need
        Query.select([
          '$id',
          'title',
          'visibility',
          'deleted',
          'lastModifiedBy',
          'createdAt',
          'updatedAt'
        ])
      ]
    );


    // Transform the response to a cleaner format
    const transformedChats = chats.documents.map(chat => ({
      id: chat.$id,
      title: chat.title,
      visibility: chat.visibility,
      deleted: chat.deleted,
      lastModifiedBy: chat.lastModifiedBy,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    // Get total count for pagination
    const totalCount = chats.total;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: transformedChats,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };

  } catch (error) {
    console.error('Error fetching chats:', error);
    throw createAppError(ErrorCode.INTERNAL_ERROR, 'An error occurred while fetching chats');
  }
});