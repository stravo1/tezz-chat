import { H3Error } from 'h3';

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RESOURCE = 'RESOURCE',
  SYSTEM = 'SYSTEM',
  TOKEN = 'TOKEN'
}

// Error codes with their respective HTTP status codes and messages
export const ErrorCode = {
  // Authentication errors (401)
  UNAUTHORIZED: {
    code: 'AUTH_001',
    status: 401,
    message: 'Unauthorized: Authentication required',
    category: ErrorCategory.AUTHENTICATION,
  },
  INVALID_SESSION: {
    code: 'AUTH_002',
    status: 401,
    message: 'Invalid or expired session',
    category: ErrorCategory.AUTHENTICATION,
  },
  SESSION_EXPIRED: {
    code: 'AUTH_003',
    status: 401,
    message: 'Unauthorized: Session has expired',
    category: ErrorCategory.AUTHENTICATION,
  },

  // Authorization errors (403)
  FORBIDDEN: {
    code: 'AUTH_003',
    status: 403,
    message: 'Forbidden: Insufficient permissions',
    category: ErrorCategory.AUTHORIZATION,
  },

  // Resource errors (404)
  RESOURCE_NOT_FOUND: {
    code: 'RES_001',
    status: 404,
    message: 'Resource not found',
    category: ErrorCategory.RESOURCE,
  },
  USER_NOT_FOUND: {
    code: 'RES_002',
    status: 404,
    message: 'User not found',
    category: ErrorCategory.RESOURCE,
  },

  // Validation errors (400)
  INVALID_REQUEST: {
    code: 'VAL_001',
    status: 400,
    message: 'Invalid request data',
    category: ErrorCategory.VALIDATION,
  },
  INVALID_FORMAT: {
    code: 'VAL_002',
    status: 400, 
    message: 'Invalid data format',
    category: ErrorCategory.VALIDATION,
  },

  // Server errors (500)
  INTERNAL_ERROR: {
    code: 'SRV_001',
    status: 500,
    message: 'Internal server error',
    category: ErrorCategory.SYSTEM,
  },
  DATABASE_ERROR: {
    code: 'SYS_001',
    status: 500,
    message: 'Database operation failed',
    category: ErrorCategory.SYSTEM,
  },
  TOKEN_LIMIT_EXCEEDED: {
    code: 'TOK_001',
    status: 429,
    message: 'Monthly token limit exceeded',
    category: ErrorCategory.TOKEN,
  },
} as const;

// Type for the ErrorCode object
export type ErrorCodeType = typeof ErrorCode;
export type ErrorCodeKey = keyof ErrorCodeType;

// Interface for the error response
export interface AppErrorResponse {
  code: string;
  message: string;
  category: ErrorCategory;
  details?: unknown;
}

/**
 * Creates an H3Error with standardized format
 * @param errorCode The error code from the ErrorCode enum
 * @param details Additional error details (optional)
 * @param overrideMessage Custom message to override the default (optional)
 */
export function createAppError(
  errorCode: ErrorCodeType[ErrorCodeKey],
  details?: unknown,
  overrideMessage?: string
): H3Error {
  const error = createError({
    statusCode: errorCode.status,
    statusMessage: overrideMessage || errorCode.message,
    data: {
      code: errorCode.code,
      message: overrideMessage || errorCode.message,
      category: errorCode.category,
      ...(details ? { details } : {}),
    } as AppErrorResponse,
  });

  return error;
}

/**
 * Handles common errors and converts them to AppError format
 * @param error The caught error
 */
export function handleError(error: unknown): H3Error {
  // Already an H3Error, return as is
  if (error instanceof H3Error) {
    return error;
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    return createAppError(
      ErrorCode.INVALID_REQUEST,
      error,
      'Validation failed: Invalid input data'
    );
  }

  // Handle other errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Unhandled error:', error);
  
  return createAppError(
    ErrorCode.INTERNAL_ERROR,
    { originalError: error },
    message
  );
} 