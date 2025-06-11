import { createSessionClient } from "../../../appwrite/config";
import { createAppError, ErrorCode } from "../../../utils/errors";

export default defineEventHandler(async (event) => {
    const { account } = createSessionClient(event);
    
    try {
        const user = await account.get();
        
        return {
            success: true,
            user
        };
    } catch (error: unknown) {
        console.error('Session check failed:', error);

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

        throw createAppError(ErrorCode.INTERNAL_ERROR, {
            details: 'Failed to check session'
        });
    }
});
