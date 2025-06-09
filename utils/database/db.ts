import type { UIMessage } from "ai";

import { createRxDatabase } from "rxdb/plugins/core";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { addRxPlugin } from "rxdb/plugins/core";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

interface DBMessage {
  id: string;
  threadId: string;
  parts: UIMessage["parts"];
  content: string;
  role: "user" | "assistant" | "system" | "data";
  createdAt: Date;
}

interface MessageSummary {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
}

const threadSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    title: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    lastMessageAt: { type: "string" },
  },
  required: ["id", "title", "createdAt", "updatedAt", "lastMessageAt"],
};

const messageSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    threadId: { type: "string", maxLength: 36 },
    parts: { type: "array" },
    content: { type: "string" },
    role: { type: "string", enum: ["user", "assistant", "system", "data"] },
    createdAt: { type: "string", maxLength: 24 },
  },
  required: ["id", "threadId", "content", "role", "createdAt"],
  indexes: ["threadId", ["threadId","createdAt"]],
};

const messageSummarySchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    threadId: { type: "string", maxLength: 36 },
    messageId: { type: "string", maxLength: 36 },
    content: { type: "string" },
    createdAt: { type: "string", maxLength: 24 },
  },
  required: ["id", "threadId", "messageId", "content", "createdAt"],
  indexes: ["threadId", ["threadId", "createdAt"]],
};

// First create the db instance
let dbInstance: Awaited<ReturnType<typeof createRxDatabase>> | null = null;
let collectionsInstance: any | null = null;

export const useDatabase = async () => {
  if (!dbInstance) {
    addRxPlugin(RxDBDevModePlugin);
    dbInstance = await createRxDatabase({
      name: "tezz-local",
      storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
      closeDuplicates: true,
    });

    collectionsInstance = await dbInstance.addCollections({
      threads: {
        schema: threadSchema,
      },
      messages: {
        schema: messageSchema,
      },
      messageSummaries: {
        schema: messageSummarySchema,
      },
    });
  }

  return {
    db: dbInstance,
    dbCollections: collectionsInstance,
  };
};

export type { Thread, DBMessage };
export { useDatabase as default };
