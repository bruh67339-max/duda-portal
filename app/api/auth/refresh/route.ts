// POST /api/auth/refresh - Refresh access token

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { logSecurityEvent, getRequestContext } from '@/lib/security/logging';
import { validateInput, refreshTokenSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { UnauthorizedError, RateLimitError, ForbiddenError } from '@/lib/utils/errors';
import { rotateRefreshToken } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  const ip = getClientIp(request);

  try {
    // Parse and validate input
    const body = await request.json();
    const { refresh_token } = validateInput(refreshTokenSchema, body);

    // Rate limiting
    const rateLimitResult = await rateLimit('client', ip);
    if (!rateLimitResult.success) {
      await logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        ...context,
        details: { action: 'token_refresh' },
        severity: 'warning',
      });
      throw new RateLimitError();
    }

    // Rotate the refresh token (invalidate old, create new)
    const result = await rotateRefreshToken(refresh_token);

    if (!result) {
      await logSecurityEvent({
        event_type: 'invalid_token',
        ...context,
        details: { action: 'token_refresh', reason: 'invalid_or_expired' },
        severity: 'warning',
      });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get user info to verify account is still active
    const supabase = getAdminClient();
    const table = result.userType === 'admin' ? 'admin_users' : 'clients';
    const { data: userRecord } = await supabase
      .from(table)
      .select('id, email, name, is_active' + (result.userType === 'admin' ? ', role' : ', locked_until'))
      .eq('id', result.userId)
      .single() as {
        data: { id: string; email: string; name: string; is_active: boolean; role?: string; locked_until?: string } | null;
      };

    if (!userRecord || !userRecord.is_active) {
      await logSecurityEvent({
        event_type: 'invalid_token',
        user_id: result.userId,
        user_type: result.userType,
        ...context,
        details: { action: 'token_refresh', reason: 'account_deactivated' },
        severity: 'warning',
      });
      throw new ForbiddenError('Account is deactivated');
    }

    // Check if client is locked
    if (result.userType === 'client' && userRecord.locked_until) {
      const lockedUntil = new Date(userRecord.locked_until);
      if (lockedUntil > new Date()) {
        throw new ForbiddenError('Account is temporarily locked');
      }
    }

    // Token refresh successful - log the event
    await logSecurityEvent({
      event_type: 'token_refresh',
      user_id: result.userId,
      user_type: result.userType,
      ...context,
    });

    return successResponse({
      refresh_token: result.token,
      expires_at: result.expiresAt.toISOString(),
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        type: result.userType,
        ...(result.userType === 'admin' && { role: userRecord.role }),
      },
      message: 'Please re-authenticate to get a new access token',
    });
  } catch (error) {
    return errorResponse(error, request);
  }
}
