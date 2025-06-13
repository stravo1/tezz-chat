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
  });
};

export const getMessagesByThreadId = async (threadId: string) => {
  const db = await initDb();
  const query = db.threads.find({
    selector: { id: threadId },
  });
  const result = await query.exec();
  const messages = result[0]?.get('chatMessageId') || [];
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
