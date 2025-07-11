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
    throw new Error(`No threads found matching name: ${name}`);
  }
  return result.map((thread: any) => ({
    id: thread.get('id'),
    title: thread.get('title'),
  }));
};
export const getThreadDetailsQuery = async (threadId: string) => {
  const db = await initDb();
  return db.threads.find({
    selector: { id: threadId },
  });
};

export const getMessagesByThreadId = async (threadId: string) => {
  const db = await initDb();
  const query = db.threads.find({
    selector: { id: threadId },
  });
  const result = await query.exec();
  let messages = result[0]?.get('chatMessageId') || [];
  // sort messages by createdAt
  messages = [...messages];
  messages.sort((a: UIMessage, b: UIMessage) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  return messages;
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
