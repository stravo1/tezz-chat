import useDatabase from './db';

export type BranchResolution = 'lazy' | 'eager';

export type ThreadMeta = {
  id: string;
  branchedFromMessageId: string | null;
  branchedMessageIds: string[];
  branchResolution: BranchResolution | null;
};

export type ResolvedMessage = {
  $id: string;
  role: string;
  content: string;
  parts: string | null;
  attachments: string | null;
  createdAt: string;
  $createdAt: string;
};

export type BranchBootstrap = Partial<
  Pick<ThreadMeta, 'branchedFromMessageId' | 'branchedMessageIds' | 'branchResolution'>
>;

const extractChatId = (chatId: unknown): string | null => {
  if (!chatId) return null;
  if (typeof chatId === 'string') return chatId;
  if (typeof chatId === 'object' && chatId !== null && '$id' in chatId) {
    return (chatId as { $id: string }).$id;
  }
  return null;
};

const transformMessage = (message: { toJSON?: () => Record<string, unknown> } | Record<string, unknown>) => {
  const data = 'toJSON' in message && message.toJSON ? message.toJSON() : message;
  const record = data as Record<string, unknown>;
  return {
    $id: record.id as string,
    role: record.role as string,
    content: record.content as string,
    parts: (record.parts as string | null) ?? null,
    attachments: (record.attachments as string | null) ?? null,
    createdAt: record.createdAt as string,
    $createdAt: record.createdAt as string,
  };
};

const sortMessages = (messages: ResolvedMessage[]) =>
  [...messages].sort((a, b) => {
    const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.$id.localeCompare(b.$id);
  });

const dedupeMessages = (messages: ResolvedMessage[]) => {
  const seen = new Set<string>();
  return messages.filter(message => {
    if (seen.has(message.$id)) return false;
    seen.add(message.$id);
    return true;
  });
};

const readThreadMeta = (thread: { get: (key: string) => unknown }, threadId: string): ThreadMeta => {
  const branchedMessageIds = thread.get('branchedMessageIds');
  return {
    id: threadId,
    branchedFromMessageId: (thread.get('branchedFromMessageId') as string | null) ?? null,
    branchedMessageIds: Array.isArray(branchedMessageIds) ? (branchedMessageIds as string[]) : [],
    branchResolution: (thread.get('branchResolution') as BranchResolution | null) ?? null,
  };
};

const isLazyBranch = (thread: ThreadMeta) =>
  thread.branchResolution === 'lazy' ||
  thread.branchedMessageIds.length > 0 ||
  Boolean(thread.branchedFromMessageId);

const getFlatMessages = async (db: { messages: { find: (query: object) => { exec: () => Promise<unknown[]> } } }, threadId: string) => {
  const result = await db.messages
    .find({
      selector: {
        _deleted: { $ne: true },
      },
      sort: [{ createdAt: 'asc' }],
    })
    .exec();

  const filteredMessages = (result as Array<{ toJSON?: () => Record<string, unknown> }>).filter(message => {
    const data = message.toJSON ? message.toJSON() : message;
    const messageChatId = extractChatId((data as Record<string, unknown>).chatId);
    return messageChatId === threadId;
  });

  return sortMessages(filteredMessages.map(transformMessage));
};

const getMessagesByIds = async (
  db: { messages: { find: (query: object) => { exec: () => Promise<unknown[]> } } },
  ids: string[]
) => {
  if (!ids.length) return [] as ResolvedMessage[];

  const result = await db.messages
    .find({
      selector: {
        id: { $in: ids },
        _deleted: { $ne: true },
      },
    })
    .exec();

  return (result as Array<{ toJSON?: () => Record<string, unknown> }>).map(transformMessage);
};

const getThreadMetaById = async (
  db: { threads: { find: (query: object) => { exec: () => Promise<unknown[]> } } },
  threadId: string
): Promise<ThreadMeta | null> => {
  const result = await db.threads.find({ selector: { id: threadId } }).exec();
  const thread = result[0] as { get: (key: string) => unknown } | undefined;
  if (!thread) return null;
  return readThreadMeta(thread, threadId);
};

export const resolveMessagesForThread = async (
  threadId: string,
  bootstrap?: BranchBootstrap
): Promise<ResolvedMessage[]> => {
  const { dbCollections: db } = await useDatabase();

  const thread =
    (await getThreadMetaById(db, threadId)) ??
    (bootstrap?.branchedMessageIds?.length
      ? ({
          id: threadId,
          branchedFromMessageId: bootstrap.branchedFromMessageId ?? null,
          branchedMessageIds: bootstrap.branchedMessageIds ?? [],
          branchResolution: bootstrap.branchResolution ?? 'lazy',
        } satisfies ThreadMeta)
      : null);

  if (!thread || !isLazyBranch(thread)) {
    return getFlatMessages(db, threadId);
  }

  const ownMessages = await getFlatMessages(db, threadId);
  const snapshotMessages = await getMessagesByIds(db, thread.branchedMessageIds);

  return sortMessages(dedupeMessages([...snapshotMessages, ...ownMessages]));
};
