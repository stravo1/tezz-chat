import { H3Event } from 'h3';
import { createError, readMultipartFormData } from 'h3';
import { Tokens } from 'node-appwrite';
import { createJWTClient, client } from '~/server/appwrite/config';
import { appwriteConfig } from '~/server/appwrite/config';
import { ErrorCode, createAppError } from '~/server/utils/errors';
import { ID } from 'node-appwrite';

// This function helps convert the multipart form data to a File
const fileToFile = (file: { data: Uint8Array; type?: string; filename?: string }): File => {
  if (!file.filename) {
    throw new Error('Filename is required');
  }
  const blob = new Blob([file.data], { type: file.type || '' });
  return new File([blob], file.filename, { type: file.type || '' });
};

const getFileDownloadURL = (bucketId: string, fileId: string, token: string) => {
  const { projectId, url } = appwriteConfig;
  return `${url}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}&token=${token}`;
};

// This doesn't work somehow....
// const createPermissions = (userId: string) => [
//   Permission.read(Role.user(userId)),
//   Permission.update(Role.user(userId)),
//   Permission.delete(Role.user(userId)),
// ];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

// Storage bucket IDs
const STORAGE_BUCKETS = {
  AUTHENTICATED: 'authenticated-files',
  PUBLIC: 'public-files',
} as const;

export default defineEventHandler(async (event: H3Event) => {
  try {
    const isAuthenticated = event.context.session?.userId;

    const { storage } = createJWTClient(event);

    console.log('File upload request received', {
      isAuthenticated,
      userId: event.context.session?.userId || 'guest',
    });
    const formData = await readMultipartFormData(event);

    if (!formData || !formData.length) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'No file uploaded');
    }

    const file = formData.find(field => field.name === 'file');
    if (!file) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'No file field found in form data');
    }

    // Validate file
    if (!file.data || !file.filename || !file.type) {
      throw createAppError(ErrorCode.INVALID_REQUEST, 'Invalid file data');
    }

    if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
      throw createAppError(
        ErrorCode.INVALID_REQUEST,
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Convert the file to a File object
    const fileObj = fileToFile({
      data: file.data,
      type: file.type,
      filename: file.filename,
    });

    // Upload to Appwrite Storage
    const bucketId = isAuthenticated ? STORAGE_BUCKETS.AUTHENTICATED : STORAGE_BUCKETS.PUBLIC;
    const fileId = ID.unique();

    await storage.createFile(bucketId, fileId, fileObj);

    // Get file details
    const fileDetails = await storage.getFile(bucketId, fileId);

    // Create file token using server-side client (which has tokens.write scope)
    const serverTokens = new Tokens(client);
    const token = await serverTokens.createFileToken(bucketId, fileId);

    const downloadUrl = getFileDownloadURL(bucketId, fileId, token.secret);
    console.log('File download URL', downloadUrl);

    return {
      success: true,
      data: {
        name: file.filename,
        mimeType: file.type || '',
        size: file.data.length,
        url: downloadUrl,
        downloadUrl,
        pathname: fileDetails.$id,
        contentType: fileDetails.mimeType,
        uploadedAt: new Date().toISOString(),
        authenticated: isAuthenticated,
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error('File upload error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process file upload',
      data: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred during file upload',
      },
    });
  }
});
