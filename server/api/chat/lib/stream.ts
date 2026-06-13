import { type UIMessage } from 'ai';
import { ID } from 'node-appwrite';
import { type Databases } from 'node-appwrite';
import {
  createMessageDocument,
  updateChatDocument,
  handleAfterEditDeletion,
  type ChatSession,
} from './db';

export interface OnFinishContext {
  databases: Databases;
  chatSession: ChatSession;
  userId: string;
  isEditOperation: boolean;
  editedFrom?: string;
  chatId?: string;
  editedFromId?: string;
  lastMessage: UIMessage;
}

/**
 * Shared `onFinish` handler for both text and image stream responses.
 * Saves the final assistant message and updates the chat document.
 */
export const createOnFinishHandler =
  (ctx: OnFinishContext) =>
  async ({ messages: allMessages }: { messages: UIMessage[] }) => {
    const {
      databases,
      chatSession,
      userId,
      isEditOperation,
      editedFrom,
      chatId,
      editedFromId,
      lastMessage,
    } = ctx;

    if (!userId || !chatSession) return;

    try {
      if (isEditOperation && chatId && editedFromId) {
        await handleAfterEditDeletion(
          databases,
          chatId,
          editedFrom ?? '',
          lastMessage,
          editedFromId
        );
        console.log('Edit operation cleanup done');
      }

      const assistantMessage = allMessages[allMessages.length - 1];
      if (!assistantMessage) {
        console.error('No assistant message found in allMessages');
        return;
      }

      await createMessageDocument(
        databases,
        chatSession.$id,
        assistantMessage,
        userId,
        'assistant',
        assistantMessage.id ?? null
      );

      await updateChatDocument(databases, chatSession.$id, {
        lastModifiedBy: 'assistant',
      });
    } catch (error) {
      console.error('Error saving assistant message:', error);
    }
  };

/**
 * Generates a unique Appwrite message ID for use with `generateMessageId`.
 */
export const generateMessageId = () => ID.unique();
