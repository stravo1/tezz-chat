import { SESSION_COOKIE, createSessionClient } from "../../../appwrite/config";

export default defineEventHandler(async (event) => {
  const { account } = createSessionClient(event);

  await account.deleteSession("current");
  deleteCookie(event, SESSION_COOKIE);

  await sendRedirect(event, "/signup");
});