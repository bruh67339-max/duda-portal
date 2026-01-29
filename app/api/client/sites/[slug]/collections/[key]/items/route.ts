// GET /api/client/sites/[slug]/collections/[key]/items - List collection items
// POST /api/client/sites/[slug]/collections/[key]/items - Create collection item

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, createCollectionItemSchema } from '@/lib/security/validation';
import { sanitizeObject } from '@/lib/security/sanitize';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError } from '@/lib/utils/errors';
import { getSitePermissions } from '@/lib/db/sites';
import { getCollectionByKey, getCollectionItems, createCollectionItem } from '@/lib/db/collections';
import { logActivity } from '@/lib/db/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> }
) {
  try {
    const { slug, key } = await params;

    // Verify client authentication and site access
    const { siteId } = await verifyClientSiteAccess(request, slug);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get collection and items
    const collection = await getCollectionByKey(siteId, key);
    const items = await getCollectionItems(collection.id);

    return successResponse({
      collection,
      items,
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string }> }
) {
  try {
    const { slug, key } = await params;

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
    if (!permissions.can_add_collection_items) {
      throw new ForbiddenError('You do not have permission to add collection items');
    }

    // Get collection and check if adding is allowed
    const collection = await getCollectionByKey(siteId, key);
    if (!collection.can_add) {
      throw new ForbiddenError('Adding items to this collection is not allowed');
    }

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(createCollectionItemSchema, body);

    // Sanitize data
    const sanitizedData = sanitizeObject(input.data as Record<string, unknown>);

    // Create item
    const item = await createCollectionItem(collection.id, {
      ...input,
      data: sanitizedData,
    });

    // Log activity
    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'create_collection_item',
      entityType: 'collection_item',
      entityId: item.id,
      changes: {
        data: { old: null, new: sanitizedData },
      },
      request,
    });

    return successResponse(item, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
