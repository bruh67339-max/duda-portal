// GET /api/client/sites/[slug]/publish-history - Get publish history

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, paginationSchema } from '@/lib/security/validation';
import { paginatedResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getPublishHistory } from '@/lib/db/activity';

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

    // Get publish history
    const { data, total } = await getPublishHistory(siteId, pagination);

    // Return without full snapshots (they can be large)
    const summaryData = data.map((entry) => ({
      id: entry.id,
      version_number: entry.version_number,
      published_by: entry.published_by,
      publisher_type: entry.publisher_type,
      notes: entry.notes,
      created_at: entry.created_at,
    }));

    return paginatedResponse(summaryData, total, pagination.page, pagination.limit);
  } catch (error) {
    return errorResponse(error, request);
  }
}
