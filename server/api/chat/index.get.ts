import { defineEventHandler, getQuery, createError } from 'h3';
import { and, eq, desc, sql } from 'drizzle-orm';
import { chat } from '~/server/db/schema';
import { db } from '~/server/db';

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export default defineEventHandler(async (event) => {
  try {
    // Get the authenticated user from the session
    const session = event.context.session;
    if (!session?.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'You must be logged in to view chats'
      });
    }

    // Get query parameters with defaults
    const query = getQuery(event);
    const page = query.page ? Math.max(1, parseInt(query.page as string, 10)) : DEFAULT_PAGE;
    const limit = query.limit 
      ? Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit as string, 10)))
      : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    // Fetch paginated chats for the user
    const [chats, totalCountResult] = await Promise.all([
      // Get paginated chats
      db.query.chat.findMany({
        where: eq(chat.userId, session.userId),
        orderBy: [desc(chat.updatedAt)],
        limit,
        offset,
      }),
      // Get total count for pagination
      db.select({ count: sql<number>`count(*)` })
        .from(chat)
        .where(eq(chat.userId, session.userId))
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: chats,
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
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error',
      message: error.message || 'An error occurred while fetching chats'
    });
  }
});