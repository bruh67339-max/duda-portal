// GET /api/admin/activity - List activity logs with filters

import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, activityLogFilterSchema, paginationSchema } from '@/lib/security/validation';
import { paginatedResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getActivityLogs } from '@/lib/db/activity';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = validateInput(activityLogFilterSchema, {
      site_id: searchParams.get('site_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      user_type: searchParams.get('user_type') || undefined,
      action: searchParams.get('action') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
    });

    const pagination = validateInput(paginationSchema, {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    // Get activity logs
    const { data, total } = await getActivityLogs(filters, pagination);

    return paginatedResponse(data, total ?? 0, pagination.page ?? 1, pagination.limit ?? 20);
  } catch (error) {
    return errorResponse(error, request);
  }
}
