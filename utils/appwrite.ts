export interface AppwriteFrontendConfig {
    url: string;
    realtimeUrl: string;
    projectId: string;
    databaseId: string;
    storageId: string;
}

export { useAppwrite } from '~/composables/useAppwrite';