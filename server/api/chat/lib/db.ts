import { Databases, ID, Permission, Role } from 'node-appwrite';
import { type UIMessage } from 'ai';
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { withRetry } from '~/server/utils/db';
import { Query } from 'node-appwrite';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: string;
  content: string;
  parts?: any[];
  isEdited?: boolean;
  editedFrom?: string;
  editedFromId?: string;
}

export interface ChatSession {
  $id: string;
  [key: string]: any;
}

export interface ChatMessageDocument {
  $id: string;
  [key: string]: any;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const createTimestamp = () => new Date().toISOString();

export const createPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

/**
 * Extracts plain text from a UIMessage parts array.
 */
export const getMessageContent = (message: UIMessage): string => {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
  }
  return '';
};

/**
 * Extracts file parts from a UIMessage parts array.
 */
export const getFileParts = (message: UIMessage): any[] => {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts.filter((part: any) => part.type === 'file');
  }
  return [];
};

// ─── DB Operations ──────────────────────────────────────────────────────────

export const createMessageDocument = async (
  databases: Databases,
  chatId: string,
  message: ChatMessage | UIMessage,
  userId: string,
  deviceId: string,
  messageIdFromMessage: string | null = null
): Promise<ChatMessageDocument> => {
  const messageId = messageIdFromMessage ?? ID.unique();
  const now = createTimestamp();

  const content =
    'content' in message && message.content
      ? message.content
      : getMessageContent(message as UIMessage);

  const fileParts = getFileParts(message as UIMessage);

  return (await withRetry(() =>
    databases.createDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      messageId,
      {
        chatId,
        role: message.role,
        content,
        parts: JSON.stringify(message.parts ?? null),
        attachments: JSON.stringify(fileParts),
        lastModifiedBy: deviceId || 'server',
        deleted: false,
        createdAt: now,
        updatedAt: now,
      },
      createPermissions(userId)
    )
  )) as ChatMessageDocument;
};

export const updateChatDocument = async (
  databases: Databases,
  chatId: string,
  updates: Record<string, any>
) => {
  return await withRetry(() =>
    databases.updateDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHATS, chatId, {
      ...updates,
      updatedAt: createTimestamp(),
    })
  );
};

/**
 * After a message edit: updates the edited message in-place and deletes all
 * subsequent messages so the conversation stays consistent.
 */
export const handleAfterEditDeletion = async (
  databases: Databases,
  chatId: string,
  editedFrom: string,
  lastMessage: UIMessage,
  editedFromId: string
) => {
  const messageBeingEdited = await withRetry(() =>
    databases.getDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHAT_MESSAGES, editedFromId)
  );

  const messagesToDelete = await withRetry(() =>
    databases.listDocuments(appwriteConfig.databaseId, COLLECTION_NAMES.CHAT_MESSAGES, [
      Query.equal('chatId', chatId),
      Query.greaterThan('createdAt', messageBeingEdited.createdAt),
    ])
  );

  await withRetry(() =>
    databases.updateDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHAT_MESSAGES,
      editedFromId,
      {
        content: getMessageContent(lastMessage),
        parts: JSON.stringify(lastMessage.parts ?? []),
        updatedAt: createTimestamp(),
      }
    )
  );

  await Promise.all(
    messagesToDelete.documents.map(msg =>
      withRetry(() =>
        databases.deleteDocument(appwriteConfig.databaseId, COLLECTION_NAMES.CHAT_MESSAGES, msg.$id)
      )
    )
  );
};
