import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

let client: Client | null = null;

export const useAppwrite = () => {
  const config = useRuntimeConfig();

  const appwriteConfig = {
    url: config.public.appwrite.url,
    realtimeUrl: config.public.appwrite.realtimeUrl,
    projectId: config.public.appwrite.projectId,
    databaseId: config.public.appwrite.databaseId,
    storageId: config.public.appwrite.storageId,
  };

  const init = async () => {
    if (client) return; // Already initialized

    client = new Client()
      .setEndpoint(appwriteConfig.url)
      .setEndpointRealtime(appwriteConfig.realtimeUrl)
      .setProject(appwriteConfig.projectId);

    try {
      const { session, jwt } = await $fetch<{ session: string | null, jwt: string | null }>('/api/auth/oauth/session-token');
      if (jwt) {
        console.log(jwt);
        client.setJWT(jwt);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  return {
    init,
    get client() {
      if (!client) throw new Error("Appwrite client not initialized. Call init() first.");
      return client;
    },
    get account() {
      if (!client) throw new Error("Appwrite not initialized");
      return new Account(client);
    },
    get databases() {
      if (!client) throw new Error("Appwrite not initialized");
      return new Databases(client);
    },
    get storage() {
      if (!client) throw new Error("Appwrite not initialized");
      return new Storage(client);
    },
    get avatars() {
      if (!client) throw new Error("Appwrite not initialized");
      return new Avatars(client);
    },
    config: appwriteConfig
  };
};
