// POST /api/admin/clients/[id]/reset-password - Reset client password

import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/auth/middleware';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logAdminAction } from '@/lib/security/logging';
import { validateInput } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError, NotFoundError } from '@/lib/utils/errors';
import { getAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    const { user: adminUser } = await verifyAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Parse and validate input
    const body = await request.json();
    const { password } = validateInput(resetPasswordSchema, body);

    const supabase = getAdminClient();

    // Verify client exists
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('id', id)
      .single() as { data: { id: string; email: string } | null; error: Error | null };

    if (clientError || !clientData) {
      throw new NotFoundError('Client not found');
    }

    const clientEmail = clientData.email;

    // Update password using admin client
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      id,
      { password }
    );

    if (updateError) {
      throw updateError;
    }

    // Log admin action
    await logAdminAction(
      adminUser.id,
      'reset_client_password',
      { client_id: id, client_email: clientEmail },
      request
    );

    return successResponse({ message: 'Password reset successfully' });
  } catch (error) {
    return errorResponse(error, request);
  }
}
