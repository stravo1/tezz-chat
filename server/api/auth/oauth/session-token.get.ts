import { SESSION_COOKIE } from "../../../appwrite/config";

export default defineEventHandler(async (event) => {

    try {
        const session = getCookie(event, SESSION_COOKIE);

        return { session: session };

    } catch (error: unknown) {
    }
}); 
