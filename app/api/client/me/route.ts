// GET /api/client/me - Get current client info

import { NextRequest } from 'next/server';
import { verifyClient } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getClientById } from '@/lib/db/clients';
import { getClientSites } from '@/lib/db/sites';

export async function GET(request: NextRequest) {
  try {
    // Verify client authentication
    const { user } = await verifyClient(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get client info
    const client = await getClientById(user.id);

    // Get assigned sites
    const sites = await getClientSites(user.id);

    return successResponse({
      ...client,
      sites: sites.map((site) => ({
        id: site.id,
        name: site.name,
        slug: site.slug,
        status: site.status,
      })),
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}
