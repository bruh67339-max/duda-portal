// POST /api/client/sites/[slug]/publish - Publish site changes

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, publishSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError } from '@/lib/utils/errors';
import { getSitePermissions, updateSite } from '@/lib/db/sites';
import { createPublishEntry, createContentSnapshot } from '@/lib/db/activity';
import { logActivity } from '@/lib/db/activity';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify client authentication and site access
    const { user, siteId } = await verifyClientSiteAccess(request, slug);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Check permissions
    const permissions = await getSitePermissions(siteId);
    if (!permissions.can_publish) {
      throw new ForbiddenError('You do not have permission to publish changes');
    }

    // Parse and validate input
    const body = await request.json().catch(() => ({}));
    const { notes } = validateInput(publishSchema, body);

    // Create content snapshot
    const snapshot = await createContentSnapshot(siteId);

    // Create publish history entry
    const publishEntry = await createPublishEntry(
      siteId,
      user.id,
      user.type,
      snapshot,
      notes
    );

    // Update site status to published if it was draft
    await updateSite(siteId, { status: 'published' });

    // Log activity
    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'publish_site',
      entityType: 'site',
      entityId: siteId,
      changes: {
        version: { old: publishEntry.version_number - 1, new: publishEntry.version_number },
      },
      request,
    });

    return successResponse({
      version: publishEntry.version_number,
      published_at: publishEntry.created_at,
      message: 'Site published successfully',
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}
