// GET /api/admin/sites - List all sites
// POST /api/admin/sites - Create a new site

import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, createSiteSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getAllSites, createSite } from '@/lib/db/sites';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Get all sites
    const sites = await getAllSites();

    return successResponse(sites);
  } catch (error) {
    return errorResponse(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user } = await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(createSiteSchema, body);

    // Create site
    const site = await createSite(input, user.id);

    // Log admin action
    await logAdminAction(user.id, 'create_site', { site_id: site.id, site_name: site.name }, request);

    return successResponse(site, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
