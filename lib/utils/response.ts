// Standardized API response utilities
// SECURITY: Never expose internal error details in production

import { NextResponse } from 'next/server';
import { isApiError, InternalError } from './errors';

export interface ApiResponseData<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Success response
export function successResponse<T>(
  data: T,
  status = 200,
  headers?: HeadersInit
): NextResponse<ApiResponseData<T>> {
  return NextResponse.json({ data }, { status, headers });
}

// Message response (for operations without data return)
export function messageResponse(
  message: string,
  status = 200
): NextResponse<ApiResponseData> {
  return NextResponse.json({ message }, { status });
}

// Error response
export function errorResponse(
  error: unknown,
  request?: Request
): NextResponse<ApiResponseData> {
  // Log full error internally
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', {
      error,
      url: request?.url,
      method: request?.method,
    });
  } else {
    // In production, log without sensitive data
    console.error('API Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      url: request?.url,
      method: request?.method,
    });
  }

  // Return safe error to client
  if (isApiError(error)) {
    const headers: HeadersInit = {};

    // Add Retry-After header for rate limit errors
    if (error.statusCode === 429) {
      headers['Retry-After'] = '60';
    }

    return NextResponse.json(
      { error: error.userMessage },
      { status: error.statusCode, headers }
    );
  }

  // Generic error for unknown issues
  const internalError = new InternalError(
    error instanceof Error ? error.message : 'Unknown error'
  );

  return NextResponse.json(
    { error: internalError.userMessage },
    { status: internalError.statusCode }
  );
}

// Paginated response
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<{
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}> {
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      limit,
      hasMore: page * limit < total,
    },
  });
}
