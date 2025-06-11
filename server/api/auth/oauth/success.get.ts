import { createAdminClient, SESSION_COOKIE } from "../../../appwrite/config";
import { createAppError, ErrorCode } from "../../../utils/errors";
import { getQuery, setCookie } from "h3";

export default defineEventHandler(async (event) => {
    const { account } = createAdminClient();
    
    // Get and validate query parameters
    const { userId, secret } = getQuery(event);

    if (!userId || !secret) {
        throw createAppError(ErrorCode.INVALID_REQUEST, {
            details: 'Missing required parameters: userId and secret'
        });
    }

    try {
        // Create session with Appwrite
        const session = await account.createSession(userId as string, secret as string);

        // Set the session cookie with secure settings
        setCookie(event, SESSION_COOKIE, session.secret, {
            expires: new Date(session.expire),
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        // Redirect to the frontend application
        const redirectUrl = new URL('/auth/success', event.node.req.headers.origin || process.env.NUXT_APP_DOMAIN || 'http://localhost:3000');
        return sendRedirect(event, redirectUrl.toString());
        
    } catch (error: unknown) {
        // Log the error for debugging
        console.error('OAuth session creation failed:', error);

        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('session')) {
                throw createAppError(ErrorCode.INVALID_SESSION, {
                    details: error.message
                });
            }
            if (error.message.includes('user')) {
                throw createAppError(ErrorCode.USER_NOT_FOUND, {
                    details: error.message
                });
            }
        }

        // Default error case
        throw createAppError(ErrorCode.INTERNAL_ERROR, {
            details: 'Failed to create session'
        });
    }
}); 