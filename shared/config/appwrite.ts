import { Client, Account, Databases, Storage, Avatars } from 'node-appwrite';

export interface AppwriteFrontendConfig {
    url: string;
    projectId: string;
    databaseId: string;
    storageId: string;
}

export const appwriteConfig: AppwriteFrontendConfig = {
    url: process.env.NUXT_PUBLIC_APPWRITE_URL as string,
    projectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID as string,
    databaseId: process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID as string,
    storageId: process.env.NUXT_PUBLIC_APPWRITE_STORAGE_ID as string,
};

export const client = new Client();

client
    .setEndpoint(appwriteConfig.url)
    .setProject(appwriteConfig.projectId)
    .setSelfSigned(true)
;

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);