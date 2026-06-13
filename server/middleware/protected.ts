import { Models } from 'node-appwrite';
import { createJWTClient } from '../appwrite/config';
import { createAppError, ErrorCode } from '../utils/errors';

// Define interface for the session context
export interface SessionContext {
  userId: string;
  email: string;
  name: string;
  isAuthenticated: boolean;
  isGuest: boolean;
  isTemporaryChat: boolean;
}

// Define routes that require authentication
const protectedRoutes = ['/api/chat', '/api/upload'];

export default defineEventHandler(async event => {
  // Initialize session context with default values
  event.context.session = {
    userId: '',
    email: '',
    name: '',
    isAuthenticated: false,
    isGuest: false,
    isTemporaryChat: false,
  } as SessionContext;

  // Skip for auth routes
  const url = event.node.req.url || '';

  // Skip authentication check for non-protected routes
  console.log(url, 'url');
  console.log(/\/shared\/[a-zA-Z0-9-]+$/.test(url), 'testing url');
  if (/\/shared\/[a-zA-Z0-9-]+$/.test(url)) {
    console.log('Skipping auth...');
    return;
  }
  if (!protectedRoutes.some(route => url.startsWith(route))) {
    return;
  }

  try {
    // Get session token from cookies
    const { account } = createJWTClient(event);

    try {
      // Get current user session
      const user: Models.User<Models.Preferences> = await account.get();

      // Appwrite anonymous users have an empty email
      const isGuest = !user.email;
      // Check for temporary chat flag in request headers
      const isTemporaryChat = getHeader(event, 'x-temporary-chat') === 'true';

      // Update session context with user data
      event.context.session = {
        userId: user.$id,
        email: user.email,
        name: user.name,
        isAuthenticated: true,
        isGuest,
        isTemporaryChat,
      } as SessionContext;
    } catch (error) {
      console.error('Session verification error:', error);
      throw createAppError(ErrorCode.INVALID_SESSION);
    }
  } catch (error) {
    console.error('Session client error:', error);
    throw createAppError(ErrorCode.UNAUTHORIZED);
  }
});
