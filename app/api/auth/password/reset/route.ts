// POST /api/auth/password/reset - Request password reset

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp, createRateLimitKey } from '@/lib/security/rate-limit';
import { logSecurityEvent, getRequestContext } from '@/lib/security/logging';
import { validateInput, passwordResetRequestSchema } from '@/lib/security/validation';
import { messageResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  const ip = getClientIp(request);

  try {
    // Parse and validate input
    const body = await request.json();
    const { email, user_type } = validateInput(passwordResetRequestSchema, body);

    // Rate limiting by IP
    const rateLimitKey = createRateLimitKey(ip, email);
    const rateLimitResult = await rateLimit('auth/reset', rateLimitKey);

    if (!rateLimitResult.success) {
      await logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        ...context,
        details: { action: 'password_reset', email },
        severity: 'warning',
      });
      throw new RateLimitError();
    }

    const supabase = getAdminClient();

    // Check if user exists in the correct table
    const table = user_type === 'admin' ? 'admin_users' : 'clients';
    const { data: userRecord } = await supabase
      .from(table)
      .select('id, email, is_active')
      .ilike('email', email)
      .single();

    // Always return success message to prevent email enumeration
    const successMsg = 'If an account exists with this email, a password reset link has been sent.';

    if (!userRecord || !userRecord.is_active) {
      // Log but don't reveal to user
      await logSecurityEvent({
        event_type: 'password_reset_request',
        ...context,
        details: { email, user_type, user_found: false },
      });
      return messageResponse(successMsg);
    }

    // Send password reset email via Supabase
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (resetError) {
      // Log error but return success to user (prevent enumeration)
      console.error('Password reset email error:', resetError);
    } else {
      // In development, log to console
      if (process.env.NODE_ENV !== 'production') {
        console.log(`
========================================
PASSWORD RESET EMAIL (DEV MODE)
========================================
To: ${email}
User Type: ${user_type}
Reset URL: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password
========================================
        `);
      }
    }

    await logSecurityEvent({
      event_type: 'password_reset_request',
      user_id: userRecord.id,
      user_type,
      ...context,
      details: { email },
    });

    return messageResponse(successMsg);
  } catch (error) {
    return errorResponse(error, request);
  }
}
