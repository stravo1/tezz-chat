import { Client } from "./AppwriteRealtimeClientFixed";

export async function getAppwriteRealtimeClient() {
  try {
    const { session, jwt } = await $fetch<{
      session: string | null;
      jwt: string | null;
    }>("/api/auth/oauth/session-token");
    if (session) {
      const { config } = useAppwrite();
      const client = new Client()
        .setEndpoint(config.url)
        .setProject(config.projectId);
      client.setSession(session);
      return client;
    }
  } catch (error) {
    console.error("Failed to fetch session:", error);
  }
}
