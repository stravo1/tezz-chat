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
    const sessionToken = getHeader(event, 'X-Fallback-Cookies');
    
    if (!sessionToken) {
      // No session token, continue with default unauthenticated context
      return;
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
      // Invalid session, continue with default unauthenticated context
      return;
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
    // Log error but continue with default unauthenticated context
    return;
  }
});