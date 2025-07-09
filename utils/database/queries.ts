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
      $or: [
        {
          title: {
            $regex: `.*${name}.*`,
            $options: 'i', // case-insensitive search
          },
        },
        {
          'chatMessageId.content': {
            $regex: `.*${name}.*`,
            $options: 'i', // case-insensitive search
          },
        },
      ],
    },
    sort: [{ updatedAt: 'desc' }],
  });
  const result = await query.exec();
  if (result.length === 0) {
    return [];
  }
  let resultAggregate = result.map((thread: any) => {
    let content =
      (thread.get('chatMessageId') as UIMessage[]).filter((msg: UIMessage) =>
        msg.content.toLowerCase().includes(name.toLowerCase())
      )[0]?.content || ''; // Get the first message content that matches the search term

    let splitContent = content.split(' ');
    let matchingTermIndex = splitContent.findIndex(word =>
      word.toLowerCase().includes(name.toLowerCase())
    );
    let sectionOfContentWhichMatches = '';
    if (matchingTermIndex !== -1) {
      // Get a section of content around the matching term
      const start = Math.max(0, matchingTermIndex - 5); // Get 5 words before the matching term
      const end = Math.min(splitContent.length, matchingTermIndex + 5); // Get 5 words after the matching term
      sectionOfContentWhichMatches = splitContent
        .slice(start, end)
        .join(' ')
        .replace(new RegExp(`(${name})`, 'gi'), '<mark>$1</mark>'); // Highlight the matching term
    }

    return {
      id: thread.get('id'),
      title: thread.get('title'),
      sectionOfContentWhichMatches, // Get the section of content that matches the search term
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
