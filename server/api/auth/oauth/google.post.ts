import { OAuthProvider } from 'node-appwrite';
import { createAdminClient } from '../../../appwrite/config';
import { createAppError, ErrorCode } from '../../../utils/errors';

export default defineEventHandler(async event => {
  const { account } = createAdminClient();

  console.log('Creating OAuth token for Google with redirect URLL', {
    success: process.env.NUXT_APP_DOMAIN + '/auth/success',
    failure: process.env.NUXT_APP_DOMAIN + '/api/auth/oauth/failure',
  });
  try {
    // Create OAuth token and get redirect URL
    const redirectURL = await account.createOAuth2Token(
      OAuthProvider.Google,
      process.env.NUXT_APP_DOMAIN + '/auth/success',
      process.env.NUXT_APP_DOMAIN + '/api/auth/oauth/failure'
    );

    // Return the redirect URL to the client
    return {
      redirectURL,
    };
  } catch (error: unknown) {
    console.error('OAuth token creation failed:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('provider')) {
        throw createAppError(ErrorCode.INVALID_REQUEST, {
          details: 'Invalid OAuth provider',
        });
      }
    }

    // Default error case
    throw createAppError(ErrorCode.INTERNAL_ERROR, {
      details: 'Failed to create OAuth token',
    });
  }
});
