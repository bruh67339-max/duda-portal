// GET /api/client/sites/[slug]/collections/[key]/items/[itemId] - Get item
// PUT /api/client/sites/[slug]/collections/[key]/items/[itemId] - Update item
// DELETE /api/client/sites/[slug]/collections/[key]/items/[itemId] - Delete item

export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, updateCollectionItemSchema } from '@/lib/security/validation';
import { sanitizeObject } from '@/lib/security/sanitize';
import { successResponse, messageResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError, NotFoundError } from '@/lib/utils/errors';
import { getSitePermissions } from '@/lib/db/sites';
import {
  getCollectionByKey,
  getCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
} from '@/lib/db/collections';
import { logActivity } from '@/lib/db/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; itemId: string }> }
) {
  try {
    const { slug, key, itemId } = await params;

    // Verify client authentication and site access
    const { siteId } = await verifyClientSiteAccess(request, slug);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Verify collection exists and belongs to site
    await getCollectionByKey(siteId, key);

    // Get item
    const item = await getCollectionItem(itemId);

    return successResponse(item);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; itemId: string }> }
) {
  try {
    const { slug, key, itemId } = await params;

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
    if (!permissions.can_edit_collections) {
      throw new ForbiddenError('You do not have permission to edit collection items');
    }

    // Verify collection exists and belongs to site
    const collection = await getCollectionByKey(siteId, key);

    // Get current item for comparison
    const currentItem = await getCollectionItem(itemId);

    // Verify item belongs to this collection
    if (currentItem.collection_id !== collection.id) {
      throw new NotFoundError('Item not found in this collection');
    }

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(updateCollectionItemSchema, body);

    // Sanitize data if provided
    const updateData = { ...input };
    if (input.data) {
      updateData.data = sanitizeObject(input.data as Record<string, unknown>);
    }

    // Update item
    const updatedItem = await updateCollectionItem(itemId, updateData);

    // Log activity
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (input.data) {
      changes.data = { old: currentItem.data, new: updateData.data };
    }
    if (input.is_visible !== undefined && input.is_visible !== currentItem.is_visible) {
      changes.is_visible = { old: currentItem.is_visible, new: input.is_visible };
    }

    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'update_collection_item',
      entityType: 'collection_item',
      entityId: itemId,
      changes,
      request,
    });

    return successResponse(updatedItem);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; key: string; itemId: string }> }
) {
  try {
    const { slug, key, itemId } = await params;

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
    if (!permissions.can_delete_collection_items) {
      throw new ForbiddenError('You do not have permission to delete collection items');
    }

    // Get collection and check if deleting is allowed
    const collection = await getCollectionByKey(siteId, key);
    if (!collection.can_delete) {
      throw new ForbiddenError('Deleting items from this collection is not allowed');
    }

    // Get item for logging
    const item = await getCollectionItem(itemId);

    // Verify item belongs to this collection
    if (item.collection_id !== collection.id) {
      throw new NotFoundError('Item not found in this collection');
    }

    // Delete item
    await deleteCollectionItem(itemId);

    // Log activity
    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'delete_collection_item',
      entityType: 'collection_item',
      entityId: itemId,
      changes: {
        data: { old: item.data, new: null },
      },
      request,
    });

    return messageResponse('Item deleted successfully');
  } catch (error) {
    return errorResponse(error, request);
  }
}
