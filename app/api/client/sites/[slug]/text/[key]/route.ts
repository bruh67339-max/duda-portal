// GET /api/client/sites/[slug]/text/[key] - Get text content
// PUT /api/client/sites/[slug]/text/[key] - Update text content

import { NextRequest } from 'next/server';
import { verifyClientSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, updateTextContentSchema } from '@/lib/security/validation';
import { sanitizeContent } from '@/lib/security/sanitize';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, ForbiddenError } from '@/lib/utils/errors';
import { getSitePermissions } from '@/lib/db/sites';
import { getTextContentByKey, updateTextContent as updateText } from '@/lib/db/content';
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

    // Get text content
    const textContent = await getTextContentByKey(siteId, key);

    return successResponse(textContent);
  } catch (error) {
    return errorResponse(error, request);
  }
}

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
    if (!permissions.can_edit_text) {
      throw new ForbiddenError('You do not have permission to edit text content');
    }

    // Get current text content for comparison and type info
    const currentContent = await getTextContentByKey(siteId, key);

    // Parse and validate input
    const body = await request.json();
    const input = validateInput(updateTextContentSchema, body);

    // Sanitize content based on type
    const sanitizedContent = sanitizeContent(
      input.content,
      currentContent.content_type,
      currentContent.max_length || undefined
    );

    // Update text content
    const updatedContent = await updateText(siteId, key, sanitizedContent);

    // Log activity
    await logActivity({
      siteId,
      userId: user.id,
      userType: user.type,
      action: 'update_text_content',
      entityType: 'text_content',
      entityId: updatedContent.id,
      changes: {
        content: {
          old: currentContent.content,
          new: sanitizedContent,
        },
      },
      request,
    });

    return successResponse(updatedContent);
  } catch (error) {
    return errorResponse(error, request);
  }
}
