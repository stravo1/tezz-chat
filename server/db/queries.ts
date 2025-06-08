import { db } from './index';
import { chat, chatMessage } from './schema';
import { eq, and } from 'drizzle-orm';

export const findChatSession = async (chatId: string, userId: string) => {
    return db.query.chat.findFirst({
        where: and(
            eq(chat.id, chatId),
            eq(chat.userId, userId)
        )
    });
};

export const insertChat = async (chatSession: any) => {
    return db.insert(chat).values({
        userId: chatSession.userId,
        title: chatSession.title,
        visibility: chatSession.visibility,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        id: chatSession.id
    });
};

export const insertChatMessage = async (message: any) => {
    return db.insert(chatMessage).values({
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt
    });
};
