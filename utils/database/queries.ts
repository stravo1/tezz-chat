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

export const createThread = async (id: string) => {
  const db = await initDb();
  return await db.threads.insert({
    id,
    title: "New Chat",
    createdAt: Date.now().toString(),
    updatedAt: Date.now().toString(),
    visibility: "private",
    deleted: false,
  });
};

export const updateThread = async (id: string, title: string) => {
  const db = await initDb();
  const thread = await db.thread.findOne(id).exec();
  if (thread) {
    return await thread.atomicPatch({
      title,
      updatedAt: Date.now().toString(),
    });
  }
};

export const deleteThread = async (id: string) => {
  const db = await initDb();
  await db.messages
    .find({
      selector: { threadId: id },
    })
    .remove();
  await db.messageSummaries.find({ selector: { threadId: id } }).remove();
  const thread = await db.threads.findOne(id).exec();
  if (thread) {
    return await thread.remove();
  }
};

export const deleteAllThreads = async () => {
  const db = await initDb();
  await db.messages.find().remove();
  await db.messageSummaries.find().remove();
  await db.threads.find().remove();
};

export const getMessagesByThreadId = async (threadId: string) => {
  const db = await initDb();
  return db.messages
    .find({
      selector: { threadId },
    })
    .sort({ createdAt: "asc" });
};

export const createMessage = async (threadId: string, message: UIMessage) => {
  const db = await initDb();
  await db.messages.insert({
    id: message.id,
    threadId,
    parts: message.parts,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt?.toISOString() || Date.now().toString(),
  });

  const thread = await db.threads.findOne({
    selector: { id: threadId },
  }).exec();
  if (thread) {
    await thread.patch({
      lastMessageAt: message.createdAt?.toISOString() || Date.now().toString(),
    });
  }
};

export const deleteTrailingMessages = async (
  threadId: string,
  createdAt: Date,
  gte: boolean = true,
) => {
  const db = await initDb();
  const query = db.messages.find({
    selector: {
      threadId,
      createdAt: {
        [gte ? "$gte" : "$gt"]: createdAt,
      },
    },
  });

  const messagesToDelete = await query.exec();
  const messageIds = messagesToDelete.map((msg: any) => msg.id);

  await query.remove();

  if (messageIds.length > 0) {
    await db.messageSummaries
      .find({
        selector: {
          messageId: {
            $in: messageIds,
          },
        },
      })
      .remove();
  }
};

export const createMessageSummary = async (
  threadId: string,
  messageId: string,
  content: string,
) => {
  const db = await initDb();
  return await db.messageSummaries.insert({
    id: ID.unique(),
    threadId,
    messageId,
    content,
    createdAt: Date.now().toString(),
  });
};

export const getMessageSummaries = async (threadId: string) => {
  const db = await initDb();
  return db.messageSummaries
    .find({
      selector: { threadId },
    })
    .sort({ createdAt: "asc" });
};
