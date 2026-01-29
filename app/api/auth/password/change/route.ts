// POST /api/auth/password/change - Change password

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/auth/middleware';
import { validatePassword } from '@/lib/auth/password';
import { revokeAllUserTokens } from '@/lib/auth/session';
import { logSecurityEvent, getRequestContext } from '@/lib/security/logging';
import { validateInput, passwordChangeSchema } from '@/lib/security/validation';
import { messageResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, UnauthorizedError } from '@/lib/utils/errors';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    // Verify authentication
    const { user, supabase: userSupabase } = await verifyAuth(request);

    // Parse and validate input
    const body = await request.json();
    const { current_password, new_password } = validateInput(passwordChangeSchema, body);

    // Validate new password strength
    const passwordValidation = validatePassword(new_password, user.email);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors.join('. '));
    }

    // Verify current password by attempting to sign in
    const adminSupabase = getAdminClient();
    const { error: signInError } = await adminSupabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });

    if (signInError) {
      await logSecurityEvent({
        event_type: 'password_change',
        user_id: user.id,
        user_type: user.type,
        ...context,
        details: { success: false, reason: 'invalid_current_password' },
        severity: 'warning',
      });
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Update password_changed_at in user table
    const table = user.type === 'admin' ? 'admin_users' : 'clients';
    await adminSupabase
      .from(table)
      .update({ password_changed_at: new Date().toISOString() })
      .eq('id', user.id);

    // Revoke all refresh tokens (force re-login everywhere)
    await revokeAllUserTokens(user.id, user.type);

    // Log password change
    await logSecurityEvent({
      event_type: 'password_change',
      user_id: user.id,
      user_type: user.type,
      ...context,
      details: { success: true },
    });

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`
========================================
PASSWORD CHANGED (DEV MODE)
========================================
User: ${user.email}
User Type: ${user.type}
All sessions have been revoked.
========================================
      `);
    }

    return messageResponse('Password changed successfully. Please log in again with your new password.');
  } catch (error) {
    return errorResponse(error, request);
  }
}
