import { defineEventHandler, getRouterParam, createError } from 'h3';
import { and, eq, desc, sql } from 'drizzle-orm';
import { chat, chatMessage } from '~/server/db/schema';
import { db } from '~/server/db';

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export default defineEventHandler(async (event) => {
  try {
    const chatId = getRouterParam(event, 'id');
    if (!chatId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Chat ID is required'
      });
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

    // First, verify the chat exists and check permissions
    const chatRecord = await db.query.chat.findFirst({
      where: eq(chat.id, chatId),
      columns: {
        id: true,
        title: true,
        userId: true,
        visibility: true
      }
    });

    if (!chatRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Chat not found'
      });
    }

    // Check if user has access to this chat
    const isOwner = chatRecord.userId === userId;
    const isPublic = chatRecord.visibility === 'public';
    
    if (!isOwner && !isPublic) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You do not have permission to view this chat'
      });
    }

    // Fetch paginated messages for the chat
    const [messages, totalCountResult] = await Promise.all([
      // Get paginated messages
      db.query.chatMessage.findMany({
        where: eq(chatMessage.chatId, chatId),
        orderBy: [desc(chatMessage.createdAt)],
        limit,
        offset,
      }),
      // Get total count for pagination
      db.select({ count: sql<number>`count(*)` })
        .from(chatMessage)
        .where(eq(chatMessage.chatId, chatId))
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: messages,
      chat: {
        id: chatRecord.id,
        title: chatRecord.title,
        isOwner,
        visibility: chatRecord.visibility,
      },
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
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error',
      message: error.message || 'An error occurred while fetching chat messages'
    });
  }
});