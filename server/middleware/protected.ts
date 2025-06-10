import { Client, Account } from 'node-appwrite';
import { appwriteConfig } from '../appwrite/config';

// Define interface for the session context
export interface SessionContext {
  userId: string;
  email: string;
  name: string;
  isAuthenticated: boolean;
}

// Define routes that require authentication
const protectedRoutes = [
  '/api/chat',
];

export default defineEventHandler(async (event) => {
  // Initialize session context with default values
  event.context.session = {
    userId: '',
    email: '',
    name: '',
    isAuthenticated: false,
  } as SessionContext;

  // Skip for auth routes
  const url = event.node.req.url || '';

  // Skip authentication check for non-protected routes
  if (!protectedRoutes.some(route => url.startsWith(route))) {
    return;
  }

  try {
    // Get session token from request headers
    const sessionToken = getHeader(event, 'x-appwrite-session');
    
    if (!sessionToken) {
      throw new Error('No session token provided');
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(appwriteConfig.url)
      .setProject(appwriteConfig.projectId)
      .setSession(sessionToken);

    const account = new Account(client);

    // Get current user session
    const session = await account.getSession('current');
    
    if (!session) {
      throw new Error('Invalid session');
    }

    // Get user details
    const user = await account.get();

    // Store session info in event context for route handlers
    event.context.session = {
      userId: user.$id,
      email: user.email,
      name: user.name,
      isAuthenticated: true,
    } as SessionContext;

  } catch (err: any) {
    console.error('Session verification error:', err);
    // Return 401 Unauthorized if session verification fails
    throw createError({
      statusCode: 401,
      message: 'Authentication failed'
    });
  }
});