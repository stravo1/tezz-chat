import { Query } from 'node-appwrite';
import { databases } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';


// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export default defineEventHandler(async (event) => {
  try {
    const chatId = getRouterParam(event, 'id');
    if (!chatId) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required');
    }

    // Get the authenticated user from the session
    const session = event.context.session;
    const userId = session?.userId;

    // Get query parameters with defaults
    const query = getQuery(event);
    const page = query.page ? Math.max(1, parseInt(query.page as string, 10)) : DEFAULT_PAGE;
    const limit = query.limit 
      ? Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string, 10)))
      : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    // Get chat by ID with permission check
    const queries = [
      Query.equal('$id', chatId)
    ];

    if (userId) {
      queries.push(
        Query.or([
          Query.equal('userId', userId),
          Query.equal('visibility', 'public')
        ])
      );
    } else {
      queries.push(Query.equal('visibility', 'public'));
    }

    const chats = await databases.listDocuments(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      queries
    );

    if (chats.documents.length === 0) {
      throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'Chat not found or you do not have permission to view it');
    }

    const chatRecord = chats.documents[0];
    const isOwner = userId ? chatRecord.userId.$id === userId : false;

    // Fetch messages for the chat
    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      [
        Query.equal('chatId', chatId),
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    const totalCount = messages.total;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      chat: messages.documents,
      isOwner,
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
    console.error('Error fetching chat messages:', error);
    throw createAppError(ErrorCode.INTERNAL_ERROR, 'An error occurred while fetching chat messages');
  }
});