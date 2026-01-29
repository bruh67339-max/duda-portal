// GET /api/client/sites/[slug]/business-info - Get business info
// PUT /api/client/sites/[slug]/business-info - Update business info

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, updateBusinessInfoSchema } from '@/lib/security/validation';
import { sanitizeObject } from '@/lib/security/sanitize';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError } from '@/lib/utils/errors';
import { getSitePermissions } from '@/lib/db/sites';
import { getBusinessInfo, updateBusinessInfo } from '@/lib/db/content';
import { logActivity } from '@/lib/db/activity';

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

    // Get business info
    const businessInfo = await getBusinessInfo(siteId);

    return successResponse(businessInfo);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
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
    const permissions = await getSitePermissions(siteId, user.id);
    if (!permissions.can_edit_business_info) {
      throw new ForbiddenError('You do not have permission to edit business info');
    }

    // Get current business info for comparison
    const currentInfo = await getBusinessInfo(siteId);

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(updateBusinessInfoSchema, body);

    // Sanitize input
    const sanitizedInput = sanitizeObject(input);

    // Update business info
    const updatedInfo = await updateBusinessInfo(siteId, sanitizedInput);

    // Log activity with changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(sanitizedInput)) {
      if (value !== undefined && currentInfo?.[key as keyof typeof currentInfo] !== value) {
        changes[key] = {
          old: currentInfo?.[key as keyof typeof currentInfo],
          new: value,
        };
      }
    }

    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'update_business_info',
      entityType: 'business_info',
      entityId: updatedInfo.id,
      changes,
      request,
    });

    return successResponse(updatedInfo);
  } catch (error) {
    return errorResponse(error, request);
  }
}
