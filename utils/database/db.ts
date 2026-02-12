import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { replicateAppwrite } from 'rxdb/plugins/replication-appwrite';

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DBMessage {
  id: string;
  threadId: string;
  parts: unknown[];
  content: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  createdAt: Date;
}

const threadSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    visibility: {
      type: 'string',
      enum: ['private', 'public'],
      default: 'private',
    },
    lastModifiedBy: { type: 'string', maxLength: 36, default: 'server' },
    branchedFromTimestamp: { type: ['string', 'null'], default: null },
    sourceChatId: { type: ['string', 'null'], maxLength: 36, default: null },
    userId: { type: 'object' },
    streamId: { type: 'array' },
    chatMessageId: { type: 'array' },
  },
  required: ['id', 'title', 'createdAt', 'updatedAt', 'visibility'],
};

const messageSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    chatId: { type: 'object' },
    parts: { type: ['string', 'null'] },
    content: { type: 'string' },
    attachments: { type: ['string', 'null'] },
    role: { type: 'string', maxLength: 20 },
    createdAt: { type: 'string', maxLength: 30 },
    updatedAt: { type: 'string', maxLength: 30 },
    lastModifiedBy: { type: 'string', maxLength: 255, default: 'server' },
  },
  required: ['id', 'content', 'role', 'createdAt'],
  indexes: ['createdAt'],
};

// Database version - increment this when schema changes to force recreation
const DB_VERSION = 8;
const DB_NAME = 'tezz-local-v' + DB_VERSION;

let dbInstance: Awaited<ReturnType<typeof createRxDatabase>> | null = null;
let collectionsInstance: any | null = null;

export const useDatabase = async () => {
  if (!dbInstance) {
    const appwrite = useAppwrite();
    const { client, config } = appwrite;

    addRxPlugin(RxDBDevModePlugin);

    try {
      dbInstance = await createRxDatabase({
        name: DB_NAME,
        storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
        ignoreDuplicate: true,
      });
    } catch (error) {
      console.error('[RxDB] Error creating database, attempting to recreate:', error);
      const { removeRxDatabase } = await import('rxdb/plugins/core');
      await removeRxDatabase(DB_NAME, getRxStorageDexie());
      dbInstance = await createRxDatabase({
        name: DB_NAME,
        storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
        ignoreDuplicate: true,
      });
    }

    collectionsInstance = await dbInstance.addCollections({
      threads: { schema: threadSchema },
      messages: { schema: messageSchema },
    });

    const threadsReplicationState = replicateAppwrite({
      replicationIdentifier: 'threads-appwrite-replication',
      client,
      databaseId: config.databaseId,
      collectionId: 'chats',
      deletedField: 'deleted',
      collection: collectionsInstance.threads,
      pull: { batchSize: 10 },
      push: { batchSize: 10 },
      live: true,
      retryTime: 5000,
    });

    const messagesReplicationState = replicateAppwrite({
      replicationIdentifier: 'messages-appwrite-replication',
      client,
      databaseId: config.databaseId,
      collectionId: 'chat_messages',
      deletedField: 'deleted',
      collection: collectionsInstance.messages,
      pull: { batchSize: 20 },
      push: { batchSize: 20 },
      live: true,
      retryTime: 5000,
    });

    threadsReplicationState.received$.subscribe(doc =>
      console.log('[RxDB Threads Replication] Received:', doc)
    );
    threadsReplicationState.sent$.subscribe(doc =>
      console.log('[RxDB Threads Replication] Sent:', doc)
    );
    threadsReplicationState.error$.subscribe(error =>
      console.error('[RxDB Threads Replication] Error:', error)
    );
    threadsReplicationState.canceled$.subscribe(bool =>
      console.log('[RxDB Threads Replication] Canceled:', bool)
    );
    threadsReplicationState.active$.subscribe(bool =>
      console.log('[RxDB Threads Replication] Active:', bool)
    );

    messagesReplicationState.received$.subscribe(doc =>
      console.log('[RxDB Messages Replication] Received:', doc)
    );
    messagesReplicationState.sent$.subscribe(doc =>
      console.log('[RxDB Messages Replication] Sent:', doc)
    );
    messagesReplicationState.error$.subscribe(error =>
      console.error('[RxDB Messages Replication] Error:', error)
    );
    messagesReplicationState.canceled$.subscribe(bool =>
      console.log('[RxDB Messages Replication] Canceled:', bool)
    );
    messagesReplicationState.active$.subscribe(bool =>
      console.log('[RxDB Messages Replication] Active:', bool)
    );
  }

  return {
    db: dbInstance,
    dbCollections: collectionsInstance,
  };
};

export type { Thread, DBMessage };
export { useDatabase as default };
