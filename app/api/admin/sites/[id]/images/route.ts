// GET /api/admin/sites/[id]/images - List image slots
// POST /api/admin/sites/[id]/images - Create image slot

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, createImageSlotSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getImages, createImageSlot } from '@/lib/db/content';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication and site access
    const { siteId } = await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get image slots
    const images = await getImages(siteId);

    return successResponse(images);
  } catch (error) {
    return errorResponse(error, request);
  }
}

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

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(createImageSlotSchema, body);

    // Create image slot
    const imageSlot = await createImageSlot(siteId, input);

    // Log admin action
    await logAdminAction(
      user.id,
      'create_image_slot',
      { site_id: siteId, image_key: input.image_key },
      request
    );

    return successResponse(imageSlot, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
