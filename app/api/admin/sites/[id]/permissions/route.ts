// GET /api/admin/sites/[id]/permissions - Get site permissions
// PUT /api/admin/sites/[id]/permissions - Update site permissions

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, updatePermissionsSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getSitePermissions, updateSitePermissions } from '@/lib/db/sites';

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

    // Get permissions
    const permissions = await getSitePermissions(siteId);

    return successResponse(permissions);
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
    const { user, siteId } = await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get current permissions for comparison
    const currentPermissions = await getSitePermissions(siteId);

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(updatePermissionsSchema, body);

    // Update permissions
    const updatedPermissions = await updateSitePermissions(siteId, input);

    // Log admin action with changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && currentPermissions[key as keyof typeof currentPermissions] !== value) {
        changes[key] = {
          old: currentPermissions[key as keyof typeof currentPermissions],
          new: value,
        };
      }
    }

    await logAdminAction(
      user.id,
      'update_permissions',
      { site_id: siteId, changes },
      request
    );

    return successResponse(updatedPermissions);
  } catch (error) {
    return errorResponse(error, request);
  }
}
