import type { Models } from "node-appwrite";

export type User = Models.Document & {
    $id: string;
    email: string;
    name: string;
    profilePicture: string;
    createdAt: Date;
    updatedAt: Date;
}

export type Chat = Models.Document & {
    $id: string;
    name: string;
    visibility: string;
    deleted: boolean;
    lastModifiedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ChatMessage = Models.Document & {
    $id: string;
    role: string;
    content: string;
    attachments: string[];
    deleted: boolean;
    lastModifiedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export type Stream = Models.Document & {
    $id: string;
    chatId: string;
    createdAt: Date;
    updatedAt: Date;
}