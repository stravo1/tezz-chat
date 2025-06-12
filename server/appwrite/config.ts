import { Client, Account, Databases, Storage, Avatars } from 'node-appwrite';

export interface AppwriteConfig {
    url: string;
    projectId: string;
    apiKey: string;
    databaseId: string;
    storageId: string;
}

export const appwriteConfig: AppwriteConfig = {
    url: process.env.NUXT_PUBLIC_APPWRITE_URL as string,
    projectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID as string,
    apiKey: process.env.NUXT_APPWRITE_SECRET_API_KEY as string,
    databaseId: process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID as string,
    storageId: process.env.NUXT_PUBLIC_APPWRITE_STORAGE_ID as string,
};

export const client = new Client();

client
    .setEndpoint(appwriteConfig.url)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.apiKey)
    .setSelfSigned(true)
;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export const SESSION_COOKIE = "tezz";

export function createAdminClient() {
  return {
    get account() {
      return account;
    },
  };
}

export function createSessionClient(event:any) {
  const config = useRuntimeConfig();

  const client = new Client()
    .setEndpoint(config.public.appwrite.url)
    .setProject(config.public.appwrite.projectId);

  const session = getCookie(event, SESSION_COOKIE);

  const databases = new Databases(client); 

  if (session) {
    client.setSession(session);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return databases;
    }
  };
}


export function createJWTClient(event:any) {
  console.log("Creating JWT Client");
  const config = useRuntimeConfig();

  const client = new Client()
    .setEndpoint(config.public.appwrite.url)
    .setProject(config.public.appwrite.projectId);

  const jwt = getHeader(event, "Authorization")?.replace("Bearer ", "");

  if (jwt) {
    client.setJWT(jwt);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    }
  };
}