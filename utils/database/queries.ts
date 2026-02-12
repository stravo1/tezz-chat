import type { UIMessage } from 'ai';
import useDatabase from './db';
import { ID } from 'node-appwrite';

let dbCollections: any = null;

const initDb = async () => {
  if (!dbCollections) {
    const { dbCollections: collections } = await useDatabase();
    dbCollections = collections;
  }
  return dbCollections;
};
export const getThreads = async () => {
  const db = await initDb();
  return db.threads.find({
    sort: [{ updatedAt: 'desc' }],
    // TODO: Add pagination
    // limit: 10,
  });
};

export const getThreadDetails = async (threadId: string) => {
  const db = await initDb();
  const query = db.threads.find({
    selector: { id: threadId },
  });
  const result = await query.exec();
  if (result.length === 0) {
    throw new Error(`Thread with ID ${threadId} not found`);
  }
  const thread = result[0];
  return {
    id: thread.get('id'),
    title: thread.get('title'),
    createdAt: thread.get('createdAt'),
    updatedAt: thread.get('updatedAt'),
    chatMessageId: thread.get('chatMessageId') || [],
    visibility: thread.get('visibility') || 'private',
    lastModifiedBy: thread.get('lastModifiedBy') || 'server',
    branchedFromTimestamp: thread.get('branchedFromTimestamp') || null,
    sourceChatId: thread.get('sourceChatId') || null,
  };
};

export const getThreadByNameMatching = async (name: string) => {
  const db = await initDb();
  const query = db.threads.find({
    selector: {
      title: {
        $regex: `.*${name}.*`,
        $options: 'i', // case-insensitive search
      },
    },
    sort: [{ updatedAt: 'desc' }],
  });
  const result = await query.exec();
  if (result.length === 0) {
    return [];
  }
  let resultAggregate = result.map((thread: any) => {
    return {
      id: thread.get('id'),
      title: thread.get('title'),
      content: 'Matched by title', // Get the section of content that matches the search term
    };
  });
  console.log('Result aggregate:', resultAggregate);
  return resultAggregate;
};

export const getThreadDetailsQuery = async (threadId: string) => {
  const db = await initDb();
  return db.threads.find({
    selector: { id: threadId },
  });
};

// Helper to extract chatId from various formats (string or relationship object)
const extractChatId = (chatId: any): string | null => {
  if (!chatId) return null;
  if (typeof chatId === 'string') return chatId;
  if (typeof chatId === 'object' && chatId.$id) return chatId.$id;
  return null;
};

// Helper to transform message data to UI format
const transformMessage = (message: any) => {
  const data = message.toJSON ? message.toJSON() : message;
  return {
    $id: data.id,
    role: data.role,
    content: data.content,
    parts: data.parts,
    attachments: data.attachments,
    createdAt: data.createdAt,
    $createdAt: data.createdAt,
  };
};

export const getMessagesByThreadId = async (threadId: string) => {
  const db = await initDb();

  // Query all non-deleted messages
  // RxDB uses _deleted internally for soft deletes
  const query = db.messages.find({
    selector: {
      _deleted: { $ne: true },
    },
    sort: [{ createdAt: 'asc' }],
  });

  const result = await query.exec();

  // Filter messages that match the threadId (handles both string and object formats)
  const filteredMessages = result.filter((message: any) => {
    const data = message.toJSON ? message.toJSON() : message;
    const messageChatId = extractChatId(data.chatId);
    return messageChatId === threadId;
  });

  console.log(
    `[getMessagesByThreadId] Found ${filteredMessages.length} messages for thread ${threadId}`
  );

  // Transform and sort messages
  const messages = filteredMessages
    .map(transformMessage)
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return messages;
};

// Subscribe to messages for a thread (for real-time updates)
export const subscribeToMessages = async (
  threadId: string,
  callback: (messages: any[]) => void
) => {
  const db = await initDb();

  // RxDB uses _deleted internally for soft deletes
  const query = db.messages.find({
    selector: {
      _deleted: { $ne: true },
    },
    sort: [{ createdAt: 'asc' }],
  });

  return query.$.subscribe((result: any[]) => {
    // Filter messages that match the threadId
    const filteredMessages = result.filter((message: any) => {
      const data = message.toJSON ? message.toJSON() : message;
      const messageChatId = extractChatId(data.chatId);
      return messageChatId === threadId;
    });

    const messages = filteredMessages
      .map(transformMessage)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    callback(messages);
  });
};

export const getTitle = async (threadId: string) => {
  const db = await initDb();
  const query = db.threads.find({
    selector: { id: threadId },
  });
  const result = await query.exec();
  const title = result[0]?.get('title') || 'No Title';
  return title;
};
