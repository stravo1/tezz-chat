import useDatabase from './db';

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

const extractChatId = (chatId: any): string | null => {
  if (!chatId) return null;
  if (typeof chatId === 'string') return chatId;
  if (typeof chatId === 'object' && chatId.$id) return chatId.$id;
  return null;
};

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

  const query = db.messages.find({
    selector: {
      _deleted: { $ne: true },
    },
    sort: [{ createdAt: 'asc' }],
  });

  const result = await query.exec();

  const filteredMessages = result.filter((message: any) => {
    const data = message.toJSON ? message.toJSON() : message;
    const messageChatId = extractChatId(data.chatId);
    return messageChatId === threadId;
  });

  console.log(
    `[getMessagesByThreadId] Found ${filteredMessages.length} messages for thread ${threadId}`
  );

  const messages = filteredMessages
    .map(transformMessage)
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return messages;
};

export const subscribeToMessages = async (
  threadId: string,
  callback: (messages: any[]) => void
) => {
  const db = await initDb();

  const query = db.messages.find({
    selector: {
      _deleted: { $ne: true },
    },
    sort: [{ createdAt: 'asc' }],
  });

  return query.$.subscribe((result: any[]) => {
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
