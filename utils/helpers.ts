import type { AppUIMessage } from '~/shared/types/ui-message';

export const createUserMessage = (id: string, text: string): AppUIMessage => ({
  id,
  parts: [{ type: 'text', text }],
  role: 'user',
});
