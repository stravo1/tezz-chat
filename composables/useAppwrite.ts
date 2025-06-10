import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const useAppwrite = () => {
  const config = useRuntimeConfig();
  
  const appwriteConfig = {
    url: config.public.appwrite.url,
    realtimeUrl: config.public.appwrite.realtimeUrl,
    projectId: config.public.appwrite.projectId,
    databaseId: config.public.appwrite.databaseId,
    storageId: config.public.appwrite.storageId,
  };

  const client = new Client();
  
  client
    .setEndpoint(appwriteConfig.url)
    .setEndpointRealtime(appwriteConfig.realtimeUrl)
    .setProject(appwriteConfig.projectId);

  const account = new Account(client);
  const databases = new Databases(client);
  const storage = new Storage(client);
  const avatars = new Avatars(client);

  return {
    appwriteConfig,
    client,
    account,
    databases,
    storage,
    avatars
  };
};
