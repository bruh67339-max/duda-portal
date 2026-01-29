// POST /api/admin/sites/[id]/api-key/regenerate - Regenerate site API key

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { regenerateApiKey } from '@/lib/db/sites';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication and site access
    const { user, siteId } = await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Regenerate API key
    const newApiKey = await regenerateApiKey(siteId);

    // Log admin action
    await logAdminAction(
      user.id,
      'regenerate_api_key',
      { site_id: siteId },
      request
    );

    return successResponse({
      api_key: newApiKey,
      message: 'API key regenerated successfully. Update your Replit site configuration.',
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}
