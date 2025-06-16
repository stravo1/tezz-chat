import { H3Event } from 'h3';
import { z } from 'zod';
import { createError, readMultipartFormData } from 'h3';
import { storage } from '~/server/appwrite/config';
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

// File validation schema
const FileSchema = z.object({
  data: z.instanceof(Uint8Array, { message: 'Invalid file data' }),
  filename: z.string().min(1, 'Filename is required'),
  type: z.string().min(1, 'Type is required'),
  size: z.number().max(5 * 1024 * 1024, 'File size should be less than 5MB'),
});

const getDownloadUrl = (fileId: string, bucketId: string) => {
  const { projectId, url } = appwriteConfig;
  return `${url}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
};

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

    // Create a unique filename with path
    const fileExt = file.filename.split('.').pop();
    const prefix = isAuthenticated ? 'auth' : 'public';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${prefix}-${uniqueSuffix}.${fileExt}`;
    const path = `uploads/${fileName}`;

    // Convert the file to a File object
    const fileObj = fileToFile({
      data: file.data,
      type: file.type,
      filename: file.filename,
    });

    // Upload to Appwrite Storage
    const bucketId = isAuthenticated ? STORAGE_BUCKETS.AUTHENTICATED : STORAGE_BUCKETS.PUBLIC;
    const fileId = ID.unique();

    const uploadedFile = await storage.createFile(bucketId, fileId, fileObj);

    // Get file details
    const fileDetails = await storage.getFile(bucketId, fileId);

    // Get file download URL
    const downloadUrl = getDownloadUrl(fileId, bucketId);

    // Get file preview URL (for images)
    const previewUrl = file.type.startsWith('image/')
      ? storage.getFilePreview(
          bucketId,
          fileId,
          800, // width
          800, // height
          undefined, // gravity
          100 // quality
        )
      : null;

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
