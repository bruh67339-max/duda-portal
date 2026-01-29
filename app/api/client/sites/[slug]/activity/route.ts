// GET /api/client/sites/[slug]/activity - Get site activity log

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, paginationSchema } from '@/lib/security/validation';
import { paginatedResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getSiteActivityLogs } from '@/lib/db/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify client authentication and site access
    const { siteId } = await verifyClientSiteAccess(request, slug);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Parse pagination
    const searchParams = request.nextUrl.searchParams;
    const pagination = validateInput(paginationSchema, {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    // Get activity logs
    const { data, total } = await getSiteActivityLogs(siteId, pagination);

    return paginatedResponse(data, total ?? 0, pagination.page ?? 1, pagination.limit ?? 20);
  } catch (error) {
    return errorResponse(error, request);
  }
}
