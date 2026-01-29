// Custom error classes for API responses
// SECURITY: Never expose internal details in user-facing messages

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public internalMessage?: string
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor() {
    super(429, 'Too many requests. Please try again later.');
    this.name = 'RateLimitError';
  }
}

export class InternalError extends ApiError {
  constructor(internalMessage?: string) {
    super(500, 'An unexpected error occurred', internalMessage);
    this.name = 'InternalError';
  }
}

// Type guard for ApiError
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
