// GET /api/admin/sites/[id] - Get site details
// PUT /api/admin/sites/[id] - Update site
// DELETE /api/admin/sites/[id] - Archive site

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, updateSiteSchema } from '@/lib/security/validation';
import { successResponse, messageResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getSiteById, updateSite, archiveSite } from '@/lib/db/sites';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication and site access
    await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get site details
    const site = await getSiteById(id);

    return successResponse(site);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication and site access
    const { user } = await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get current site for comparison
    const currentSite = await getSiteById(id);

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(updateSiteSchema, body);

    // Update site
    const updatedSite = await updateSite(id, input);

    // Log admin action with changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && currentSite[key as keyof typeof currentSite] !== value) {
        changes[key] = {
          old: currentSite[key as keyof typeof currentSite],
          new: value,
        };
      }
    }

    await logAdminAction(
      user.id,
      'update_site',
      { site_id: id, changes },
      request
    );

    return successResponse(updatedSite);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication and site access
    const { user } = await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get site for logging
    const site = await getSiteById(id);

    // Archive site (soft delete)
    await archiveSite(id);

    // Log admin action
    await logAdminAction(
      user.id,
      'archive_site',
      { site_id: id, site_name: site.name },
      request
    );

    return messageResponse('Site archived successfully');
  } catch (error) {
    return errorResponse(error, request);
  }
}
