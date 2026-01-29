// DELETE /api/admin/sites/[id]/text-fields/[fieldId] - Delete text field

import { NextRequest } from 'next/server';
import { verifyAdminSiteAccess } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, NotFoundError } from '@/lib/utils/errors';
import { getAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;

    // Verify admin authentication and site access
    const { user, siteId } = await verifyAdminSiteAccess(request, id);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    const supabase = getAdminClient();

    // Verify the field belongs to this site
    const { data: field, error: fieldError } = await supabase
      .from('text_fields')
      .select('id, field_key')
      .eq('id', fieldId)
      .eq('site_id', siteId)
      .single();

    if (fieldError || !field) {
      throw new NotFoundError('Text field not found');
    }

    // Delete any associated content first
    await supabase
      .from('text_content')
      .delete()
      .eq('field_id', fieldId);

    // Delete the field
    const { error: deleteError } = await supabase
      .from('text_fields')
      .delete()
      .eq('id', fieldId);

    if (deleteError) {
      throw deleteError;
    }

    // Log admin action
    await logAdminAction(
      user.id,
      'delete_text_field',
      { site_id: siteId, field_id: fieldId, field_key: field.field_key },
      request
    );

    return successResponse({ message: 'Text field deleted' });
  } catch (error) {
    return errorResponse(error, request);
  }
}
