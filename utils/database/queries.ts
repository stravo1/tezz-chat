import type { UIMessage } from "ai";
import useDatabase from "./db";
import { ID } from "node-appwrite";

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
  return db.threads.find().sort({ lastMessageAt: "desc" });
};

export const getMessagesByThreadId = async (threadId: string) => {
  const db = await initDb();
  return db.messages
    .find({
      selector: { threadId },
    })
    .sort({ createdAt: "asc" });
};

export const getMessageSummaries = async (threadId: string) => {
  const db = await initDb();
  return db.messageSummaries
    .find({
      selector: { threadId },
    })
    .sort({ createdAt: "asc" });
};
