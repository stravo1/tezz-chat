import { Account, Client, Databases, Storage, Avatars } from 'appwrite';

let client: Client | null = null;

interface AppwriteConfig {
  url: string;
  realtimeUrl: string;
  projectId: string;
  databaseId: string;
  storageId: string;
}

export const useAppwrite = () => {
  const config = useRuntimeConfig();
  const isBrowser = typeof window !== 'undefined';
  let socket: WebSocket | null = null;

  const appwriteConfig: AppwriteConfig = {
    url: config.public.appwrite.url,
    realtimeUrl: config.public.appwrite.realtimeUrl,
    projectId: config.public.appwrite.projectId,
    databaseId: config.public.appwrite.databaseId,
    storageId: config.public.appwrite.storageId,
  };

  const initWebSocket = (sessionToken: string | null) => {
    if (!isBrowser) return;
    
    if (socket) {
      socket.close();
    }

    let wsUrl = appwriteConfig.realtimeUrl+"?project="+appwriteConfig.projectId+"&channels%5B%5D=databases."+appwriteConfig.databaseId+".collections.chats.documents";

    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      if (sessionToken) {
        const authMessage = {
          type: 'authentication',
          data: { session: sessionToken }
        };
        socket?.send(JSON.stringify(authMessage));
      }
    });
  };

  const init = async () => {
    if (client) return;

    let sessionToken: string | null = null;
    try {
      const response = await $fetch<{ session: string | null }>('/api/auth/oauth/session-token');
      sessionToken = response?.session || null;
    } catch (error) {
      console.error('Failed to fetch session:', error);
      return;
    }

    client = new Client()
      .setEndpoint(appwriteConfig.url)
      .setProject(appwriteConfig.projectId);

    if (sessionToken) {
      client.setSession(sessionToken);
      initWebSocket(sessionToken);
    } else {
      initWebSocket(null);
    }
  };

  const updateSession = (newSessionToken: string | null) => {
    if (!client) return;
    
    if (newSessionToken) {
      client.setSession(newSessionToken);
      initWebSocket(newSessionToken);
    } else {
      client.setSession('');
      if (socket) {
        socket.close();
        socket = null;
      }
    }
  };

  return {
    init,
    updateSession,
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
    config: appwriteConfig,
    getWebSocket: () => socket
  };
};
