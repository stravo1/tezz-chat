import { Databases, ID, Query } from 'node-appwrite';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { withRetry } from '~/server/utils/db';
import { createPermissions, createTimestamp, updateChatDocument } from './db';

type AppwriteDocument = Record<string, unknown> & { $id: string };

export type MaterializeOnDeleteResult = {
  materializedBranchCount: number;
  materializedMessageCount: number;
  messagesToDelete: AppwriteDocument[];
};

const listAllDocuments = async (
  databases: Databases,
  collectionId: string,
  queries: string[] = []
): Promise<AppwriteDocument[]> => {
  const documents: AppwriteDocument[] = [];
  const pageSize = 100;
  let cursor: string | undefined;

  while (true) {
    const pageQueries = [...queries, Query.limit(pageSize)];
    if (cursor) {
      pageQueries.push(Query.cursorAfter(cursor));
    }

    const response = await withRetry(() =>
      databases.listDocuments(appwriteConfig.databaseId, collectionId, pageQueries)
    );

    documents.push(...(response.documents as AppwriteDocument[]));

    if (response.documents.length < pageSize) {
      break;
    }

    cursor = response.documents[response.documents.length - 1].$id;
  }

  return documents;
};

const copyMessageIntoChat = async (
  databases: Databases,
  sourceMessage: AppwriteDocument,
  targetChatId: string,
  userId: string
): Promise<string> => {
  const newMessageId = ID.unique();
  const now = createTimestamp();

  await withRetry(() =>
    databases.createDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      newMessageId,
      {
        chatId: targetChatId,
        role: sourceMessage.role,
        content: sourceMessage.content,
        parts: sourceMessage.parts ?? null,
        attachments: sourceMessage.attachments ?? null,
        deleted: false,
        lastModifiedBy: 'materialize-on-delete',
        createdAt: sourceMessage.createdAt,
        updatedAt: now,
      },
      createPermissions(userId)
    )
  );

  return newMessageId;
};

/**
 * Before deleting a chat, copy any snapshot messages referenced by lazy branches
 * into those branch chats so branch history survives source deletion.
 */
export const materializeLazyBranchesBeforeChatDelete = async (
  databases: Databases,
  chatId: string,
  userId: string
): Promise<MaterializeOnDeleteResult> => {
  const messagesToDelete = await listAllDocuments(databases, COLLECTION_NAMES.CHAT_MESSAGES, [
    Query.equal('chatId', chatId),
  ]);
  const idsBeingDeleted = new Set(messagesToDelete.map(message => message.$id));

  if (!idsBeingDeleted.size) {
    return {
      materializedBranchCount: 0,
      materializedMessageCount: 0,
      messagesToDelete,
    };
  }

  const allChats = await listAllDocuments(databases, COLLECTION_NAMES.CHATS, [
    Query.equal('deleted', false),
  ]);

  const dependentBranches = allChats.filter(chat => {
    if (chat.$id === chatId) {
      return false;
    }

    const snapshotIds = Array.isArray(chat.branchedMessageIds)
      ? (chat.branchedMessageIds as string[])
      : [];

    return snapshotIds.some(id => idsBeingDeleted.has(id));
  });

  let materializedBranchCount = 0;
  let materializedMessageCount = 0;

  for (const branch of dependentBranches) {
    const snapshotIds = Array.isArray(branch.branchedMessageIds)
      ? [...(branch.branchedMessageIds as string[])]
      : [];
    const idRemap = new Map<string, string>();

    for (const messageId of snapshotIds) {
      if (!idsBeingDeleted.has(messageId)) {
        continue;
      }

      const sourceMessage = (await withRetry(() =>
        databases.getDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHAT_MESSAGES, messageId)
      )) as AppwriteDocument;

      const newMessageId = await copyMessageIntoChat(databases, sourceMessage, branch.$id, userId);

      idRemap.set(messageId, newMessageId);
      materializedMessageCount++;
    }

    if (!idRemap.size) {
      continue;
    }

    materializedBranchCount++;

    const updatedSnapshotIds = snapshotIds.map(id => idRemap.get(id) ?? id);
    const branchFromMessageId =
      typeof branch.branchedFromMessageId === 'string' ? branch.branchedFromMessageId : null;
    const updatedBranchFromMessageId =
      branchFromMessageId && idRemap.has(branchFromMessageId)
        ? idRemap.get(branchFromMessageId)
        : branchFromMessageId;

    await updateChatDocument(databases, branch.$id, {
      branchedMessageIds: updatedSnapshotIds,
      branchedFromMessageId: updatedBranchFromMessageId,
      lastModifiedBy: 'materialize-on-delete',
    });
  }

  return {
    materializedBranchCount,
    materializedMessageCount,
    messagesToDelete,
  };
};
