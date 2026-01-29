// GET /api/admin/sites/[id]/collections - List collections
// POST /api/admin/sites/[id]/collections - Create collection

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, createCollectionSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getCollections, createCollection } from '@/lib/db/collections';

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

    // Get collections
    const collections = await getCollections(siteId);

    return successResponse(collections);
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
    const input = validateInput(createCollectionSchema, body);

    // Create collection
    const collection = await createCollection(siteId, input);

    // Log admin action
    await logAdminAction(
      user.id,
      'create_collection',
      { site_id: siteId, collection_key: input.collection_key },
      request
    );

    return successResponse(collection, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
