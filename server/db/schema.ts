import { sql } from "drizzle-orm";
import { integer, text, blob, sqliteTable as table, uniqueIndex, index, customType } from "drizzle-orm/sqlite-core";
import { v4 as uuid } from "uuid";
import { InferSelectModel } from "drizzle-orm";

export const user = table("user", {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    profilePicture: text("profile_picture"),
    name: text("name").notNull(),
    plan: text("plan", { enum: ["FREE", "BASIC", "PREMIUM", "UNLIMITED"] }).notNull().default("FREE"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}) 

export const chat = table("chat", {
    id: text("id").primaryKey().$defaultFn(uuid),
    userId: text("user_id").notNull().references(() => user.id),
    title: text('title').notNull().default("New Chat"),
    visibility: text('visibility', { enum: ['private', 'public'] }).notNull().default('private'),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const chatMessage = table("chat_message", {
    id: text("id").primaryKey().$defaultFn(uuid),
    chatId: text("chat_id").notNull().references(() => chat.id, { onDelete: 'cascade' }),
    role: text("role", { enum: ['user', 'assistant', 'tool', 'system'] }).notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const stream = table("stream", {
    id: text("id").primaryKey().$defaultFn(uuid),
    chatId: text("chat_id").notNull().references(() => chat.id, { onDelete: 'cascade' }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export type User = InferSelectModel<typeof user>
export type Chat = InferSelectModel<typeof chat>
export type ChatMessage = InferSelectModel<typeof chatMessage>
export type Stream = InferSelectModel<typeof stream>
