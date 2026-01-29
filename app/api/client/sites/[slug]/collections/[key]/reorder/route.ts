// PUT /api/client/sites/[slug]/collections/[key]/reorder - Reorder collection items

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, reorderCollectionItemsSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError } from '@/lib/utils/errors';
import { getSitePermissions } from '@/lib/db/sites';
import { getCollectionByKey, reorderCollectionItems } from '@/lib/db/collections';
import { logActivity } from '@/lib/db/activity';

export async function PUT(
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
    if (!permissions.can_reorder_collection_items) {
      throw new ForbiddenError('You do not have permission to reorder collection items');
    }

    // Get collection and check if reordering is allowed
    const collection = await getCollectionByKey(siteId, key);
    if (!collection.can_reorder) {
      throw new ForbiddenError('Reordering items in this collection is not allowed');
    }

    // Parse and validate input
    const body = await request.json();
    const { item_ids } = validateInput(reorderCollectionItemsSchema, body);

    // Reorder items
    const reorderedItems = await reorderCollectionItems(collection.id, item_ids);

    // Log activity
    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'reorder_collection_items',
      entityType: 'collection',
      entityId: collection.id,
      changes: {
        order: { old: null, new: item_ids },
      },
      request,
    });

    return successResponse(reorderedItems);
  } catch (error) {
    return errorResponse(error, request);
  }
}
