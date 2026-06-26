import useDatabase from './db';
import {
  resolveMessagesForThread,
  type BranchBootstrap,
  type ResolvedMessage,
} from './resolveMessages';

let dbCollections: any = null;

const initDb = async () => {
  if (!dbCollections) {
    const { dbCollections: collections } = await useDatabase();
    dbCollections = collections;
  }
  return dbCollections;
};

export type { BranchBootstrap, ResolvedMessage };

export const getThreads = async () => {
  const db = await initDb();
  return db.threads.find({
    sort: [{ updatedAt: 'desc' }],
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
    branchedFromMessageId: thread.get('branchedFromMessageId') || null,
    branchedMessageIds: thread.get('branchedMessageIds') || [],
    branchResolution: thread.get('branchResolution') || null,
  };
};

export const getThreadByNameMatching = async (name: string) => {
  const db = await initDb();
  const query = db.threads.find({
    selector: {
      title: {
        $regex: `.*${name}.*`,
        $options: 'i',
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
      content: 'Matched by title',
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

export const getMessagesByThreadId = async (
  threadId: string,
  bootstrap?: BranchBootstrap
): Promise<ResolvedMessage[]> => {
  const messages = await resolveMessagesForThread(threadId, bootstrap);
  console.log(`[getMessagesByThreadId] Resolved ${messages.length} messages for thread ${threadId}`);
  return messages;
};

export const subscribeToMessages = async (
  threadId: string,
  callback: (messages: ResolvedMessage[]) => void,
  bootstrap?: BranchBootstrap
) => {
  const db = await initDb();

  const publish = async () => {
    const messages = await resolveMessagesForThread(threadId, bootstrap);
    callback(messages);
  };

  await publish();

  const messagesSubscription = db.messages.find({ selector: { _deleted: { $ne: true } } }).$.subscribe(() => {
    void publish();
  });

  const threadsSubscription = db.threads.find({ selector: { id: threadId } }).$.subscribe(() => {
    void publish();
  });

  return () => {
    messagesSubscription.unsubscribe();
    threadsSubscription.unsubscribe();
  };
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
