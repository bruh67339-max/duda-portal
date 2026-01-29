// GET /api/admin/sites/[id]/text-fields - List text fields
// POST /api/admin/sites/[id]/text-fields - Create text field

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput, createTextFieldSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';
import { getTextContent, createTextField } from '@/lib/db/content';

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

    // Get text content fields
    const textFields = await getTextContent(siteId);

    return successResponse(textFields);
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
    const input = validateInput(createTextFieldSchema, body);

    // Create text field
    const textField = await createTextField(siteId, input);

    // Log admin action
    await logAdminAction(
      user.id,
      'create_text_field',
      { site_id: siteId, field_key: input.content_key },
      request
    );

    return successResponse(textField, 201);
  } catch (error) {
    return errorResponse(error, request);
  }
}
