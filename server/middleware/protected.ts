import { withSession } from "supertokens-node/custom";
import { convertToRequest } from '../utils/convertToRequest';
import { createAppError, ErrorCode } from '../utils/errors';

// Define interface for the session context
export interface SessionContext {
  userId: string;
  sessionHandle: string;
  accessTokenPayload: Record<string, any>;
  isAuthenticated: boolean;
}

// Define routes that require authentication
const protectedRoutes = [
  '/api/chat',
];

export default defineEventHandler(async (event) => {
  // Skip for auth routes
  const url = event.node.req.url || '';
  
  // Skip authentication check for non-protected routes
  if (!protectedRoutes.some(route => url.startsWith(route))) {
    return;
  }
  
  try {
    const request = await convertToRequest(event);
    
    // Use withSession with proper error handling and session verification
    const response = await withSession(
      request,
      async (err, session) => {
        if (err) {
          console.error('Session error:', err);
          throw createAppError(
            ErrorCode.UNAUTHORIZED,
            { originalError: err }
          );
        }

        if (!session) {
          throw createAppError(ErrorCode.INVALID_SESSION);
        }

        // Store session info in event context for route handlers
        event.context.session = {
          userId: session.getUserId(),
          sessionHandle: session.getHandle(),
          accessTokenPayload: session.getAccessTokenPayload(),
          isAuthenticated: true,
        } as SessionContext;

        // Don't return a response - this is important!
        // Just return undefined so the handler can continue
        return undefined;
      },
      {
        sessionRequired: true,
        antiCsrfCheck: true,
        checkDatabase: true
      }
    );
    
    // Don't return the response from withSession
    // This allows the endpoint handler to execute
  } catch (err: any) {
    console.error('Session verification error:', err);
    
    // Use our error handling utility
    if (err?.statusCode === 401) {
      // Keep the error as is if it's already formatted
      throw err;
    } else {
      throw createAppError(
        ErrorCode.UNAUTHORIZED,
        { originalError: err },
        'Authentication failed'
      );
    }
  }
}); 