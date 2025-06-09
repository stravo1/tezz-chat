import type { ErrorCode } from '~/server/utils/errors';

// Chat Message Types
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id?: string;
    role: ChatRole;
    content: string;
    experimental_attachments?: any[];
}

// Chat Request Types
export interface ChatRequest {
    messages: ChatMessage[];
    chatId?: string;
    deviceId?: string;
}

// Chat Response Types
export interface ChatListItem {
    id: string;
    title: string;
    visibility: string;
    deleted: boolean;
    lastModifiedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ChatListResponse {
    data: ChatListItem[];
    pagination: PaginationInfo;
}

export interface StreamResponse {
    type: 'stream';
    data: Response;
}

export interface ErrorResponse {
    success: false;
    error: {
        code: typeof ErrorCode[keyof typeof ErrorCode];
        message: string;
    };
}

export type ChatResponse = StreamResponse | ErrorResponse;
