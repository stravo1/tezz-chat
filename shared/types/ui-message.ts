import type { UIMessage } from 'ai';

export type ChatAttachment = {
  url: string;
  name: string;
  contentType?: string;
};

export type AppUIMessage = UIMessage & {
  content?: string;
  createdAt?: string | number;
  $createdAt?: string;
  experimental_attachments?: ChatAttachment[];
};
