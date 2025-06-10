import { Query } from 'node-appwrite';
import { databases } from "~/server/appwrite/config";
import { appwriteConfig } from '~/server/appwrite/config';
import { COLLECTION_NAMES } from '~/server/appwrite/constant';
import { ErrorCode, createAppError } from '~/server/utils/errors';

export default defineEventHandler(async (event) => {
  try {
    const chatId = getRouterParam(event, 'id');
    console.log(chatId);

    if (!chatId) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'Chat ID is required');
    }

    // First, get the chat to check its visibility
    const chat = await databases.getDocument(
      appwriteConfig.databaseId,
      COLLECTION_NAMES.CHATS,
      chatId
    );

    
    // // Check if user has access to the chat
    const isPublic = chat.visibility === 'public';
    console.log(isPublic);
    if(!isPublic){
      throw createAppError(ErrorCode.FORBIDDEN)
    }

    return chat

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw createAppError(ErrorCode.RESOURCE_NOT_FOUND, 'Chat not found');
      }
      if (error.message.includes('permission')) {
        throw createAppError(ErrorCode.FORBIDDEN, 'You do not have permission to view this chat');
      }
    }
    
    throw createAppError(ErrorCode.INTERNAL_ERROR, 'An error occurred while fetching chat messages');
  }
});