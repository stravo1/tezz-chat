import { createSessionClient, SESSION_COOKIE } from "../../../appwrite/config";

export default defineEventHandler(async (event) => {
  try {
    const session = getCookie(event, SESSION_COOKIE);
    const { account } = createSessionClient(event);
    const jwt = await account.createJWT();
    console.log("JWT:", jwt);
    return { session: session, jwt: jwt.jwt };
  } catch (error: unknown) {}
});
