import { defineEventHandler, readBody } from 'h3';
import { ID, Permission, Query, Role } from 'node-appwrite';
import { createJWTClient } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { z } from 'zod';
import { withRetry } from '~/server/utils/db';

const updateChatDocument = async (databases: any, chatId: string, updates: any) => {
  return await databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
    ...updates,
    updatedAt: createTimestamp(),
  });
};

const branchChatSchema = z.object({
  sourceChatId: z.string().describe('ID of the chat to branch from'),
  deviceId: z.string().optional().describe('Optional device identifier'),
  branchFromMessageId: z.string(),
});

const createTimestamp = () => new Date().toISOString();

const createPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const sortMessagesStable = (messages: Array<{ $id: string; createdAt: string }>) =>
  [...messages].sort((a, b) => {
    const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.$id.localeCompare(b.$id);
  });

const mergeUniqueIds = (ids: string[]) => {
  const seen = new Set<string>();
  return ids.filter(id => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export default defineEventHandler(async event => {
  try {
    const { databases } = createJWTClient(event);
    const userId = event.context.session?.userId;

    if (!userId) {
      throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
    }

    const body = await readBody(event);
    const validation = branchChatSchema.safeParse(body);

    if (!validation.success) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        `Invalid input: ${validation.error.errors[0]?.message}`
      );
    }

    const { sourceChatId, deviceId, branchFromMessageId } = validation.data;

    await withRetry(() =>
      databases.getDocument(
        appwriteConfig.databaseId,
        COLLECTION_NAMES.CHAT_MESSAGES,
        branchFromMessageId
      )
    );

    const sourceChat = await databases.getDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      sourceChatId
    );

    if (!sourceChat) {
      throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'Source chat not found');
    }

    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      [Query.equal('chatId', sourceChatId), Query.equal('deleted', false)]
    );

    const sortedMessages = sortMessagesStable(messages.documents as Array<{ $id: string; createdAt: string }>);
    const branchIndex = sortedMessages.findIndex(message => message.$id === branchFromMessageId);

    if (branchIndex === -1) {
      throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'Branch message not found in source chat');
    }

    const ownSnapshotIds = sortedMessages.slice(0, branchIndex + 1).map(message => message.$id);
    const ancestorIds = Array.isArray(sourceChat.branchedMessageIds)
      ? (sourceChat.branchedMessageIds as string[])
      : [];
    const isLazySource =
      sourceChat.branchResolution === 'lazy' ||
      ancestorIds.length > 0 ||
      Boolean(sourceChat.branchedFromMessageId);

    const branchedMessageIds = isLazySource
      ? mergeUniqueIds([...ancestorIds, ...ownSnapshotIds])
      : ownSnapshotIds;

    if (!branchedMessageIds.length) {
      throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'No messages found to branch from');
    }

    const newChatId = ID.unique();
    const now = createTimestamp();
    const branchTitle = `${sourceChat.title} (Branch)`;

    await databases.createDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      newChatId,
      {
        title: branchTitle,
        visibility: 'private',
        deleted: false,
        lastModifiedBy: deviceId || 'server',
        createdAt: now,
        updatedAt: now,
        branchedFromMessageId: branchFromMessageId,
        branchedMessageIds,
        branchResolution: 'lazy',
      },
      createPermissions(userId)
    );

    await updateChatDocument(databases, newChatId, {
      lastModifiedBy: deviceId || 'server',
      updatedAt: now,
    });

    return {
      success: true,
      data: {
        chatId: newChatId,
        title: branchTitle,
        messageCount: branchedMessageIds.length,
        branchFromMessageId,
        branchedMessageIds,
        branchResolution: 'lazy',
      },
    };
  } catch (error) {
    console.error('Chat branching error:', error);
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    throw createAppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'An error occurred while branching chat'
    );
  }
});
