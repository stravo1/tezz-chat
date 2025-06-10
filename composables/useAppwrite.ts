import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

// Create instances outside the composable
let client: Client | null = null;
let account: Account | null = null;
let databases: Databases | null = null;
let storage: Storage | null = null;
let avatars: Avatars | null = null;

export const useAppwrite = () => {
  const config = useRuntimeConfig();
  
  const appwriteConfig = {
    url: config.public.appwrite.url,
    realtimeUrl: config.public.appwrite.realtimeUrl,
    projectId: config.public.appwrite.projectId,
    databaseId: config.public.appwrite.databaseId,
    storageId: config.public.appwrite.storageId,
  };

  // Initialize client only once
  if (!client) {
    client = new Client();
    console.log("Appwrite client initialized with config:", appwriteConfig);
    
    client
      .setEndpoint(appwriteConfig.url)
      .setEndpointRealtime(appwriteConfig.realtimeUrl)
      .setProject(appwriteConfig.projectId);

    account = new Account(client);
    databases = new Databases(client);
    storage = new Storage(client);
    avatars = new Avatars(client);
  } else {
    console.log("Using existing Appwrite client instance.");
  }

  return {
    config: appwriteConfig,
    client,
    account,
    databases,
    storage,
    avatars
  };
};
