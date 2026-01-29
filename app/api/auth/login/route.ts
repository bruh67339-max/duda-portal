// POST /api/auth/login - Login for admin or client

import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp, createRateLimitKey } from '@/lib/security/rate-limit';
import { logSecurityEvent, getRequestContext } from '@/lib/security/logging';
import { validateInput, loginSchema } from '@/lib/security/validation';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { UnauthorizedError, ForbiddenError, RateLimitError, ValidationError } from '@/lib/utils/errors';
import {
  createRefreshToken,
  updateLastLogin,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  ACCESS_TOKEN_EXPIRY,
} from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  const ip = getClientIp(request);

  try {
    // Parse and validate input
    const body = await request.json();
    const { email, password, user_type } = validateInput(loginSchema, body);

    // Rate limiting by IP + email
    const rateLimitKey = createRateLimitKey(ip, email);
    const rateLimitResult = await rateLimit('auth/login', rateLimitKey);

    if (!rateLimitResult.success) {
      await logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        ...context,
        details: { email, user_type },
        severity: 'critical',
      });
      throw new RateLimitError();
    }

    const supabase = getAdminClient();

    // Attempt sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      await logSecurityEvent({
        event_type: 'login_failure',
        ...context,
        details: { email, user_type, reason: 'invalid_credentials' },
        severity: 'warning',
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user exists in the correct table
    const table = user_type === 'admin' ? 'admin_users' : 'clients';
    const { data: userRecord, error: userError } = await supabase
      .from(table)
      .select('id, email, name, is_active' + (user_type === 'admin' ? ', role' : ', locked_until'))
      .eq('id', authData.user.id)
      .single();

    if (userError || !userRecord) {
      await logSecurityEvent({
        event_type: 'login_failure',
        user_id: authData.user.id,
        user_type,
        ...context,
        details: { email, reason: 'user_type_mismatch' },
        severity: 'warning',
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is active
    if (!userRecord.is_active) {
      await logSecurityEvent({
        event_type: 'login_failure',
        user_id: userRecord.id,
        user_type,
        ...context,
        details: { email, reason: 'account_deactivated' },
        severity: 'warning',
      });
      throw new ForbiddenError('Account is deactivated');
    }

    // Check if client account is locked
    if (user_type === 'client' && userRecord.locked_until) {
      const lockedUntil = new Date(userRecord.locked_until);
      if (lockedUntil > new Date()) {
        await logSecurityEvent({
          event_type: 'login_failure',
          user_id: userRecord.id,
          user_type,
          ...context,
          details: { email, reason: 'account_locked', locked_until: userRecord.locked_until },
          severity: 'warning',
        });
        throw new ForbiddenError('Account is temporarily locked. Please try again later.');
      }
    }

    // Login successful - reset failed attempts for clients
    if (user_type === 'client') {
      await resetFailedLoginAttempts(userRecord.id);
    }

    // Create refresh token
    const refreshToken = await createRefreshToken(userRecord.id, user_type);

    // Update last login
    await updateLastLogin(userRecord.id, user_type);

    // Log successful login
    await logSecurityEvent({
      event_type: 'login_success',
      user_id: userRecord.id,
      user_type,
      ...context,
    });

    return successResponse({
      access_token: authData.session?.access_token,
      refresh_token: refreshToken.token,
      expires_in: ACCESS_TOKEN_EXPIRY,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        type: user_type,
        ...(user_type === 'admin' && { role: userRecord.role }),
      },
    });
  } catch (error) {
    // For invalid credentials, increment failed attempts for clients
    if (error instanceof UnauthorizedError) {
      try {
        const body = await request.clone().json();
        if (body.user_type === 'client' && body.email) {
          const supabase = getAdminClient();
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .ilike('email', body.email)
            .single();

          if (client) {
            const result = await incrementFailedLoginAttempts(client.id);
            if (result.lockedUntil) {
              await logSecurityEvent({
                event_type: 'account_locked',
                user_id: client.id,
                user_type: 'client',
                ...context,
                details: { locked_until: result.lockedUntil.toISOString() },
                severity: 'critical',
              });
            }
          }
        }
      } catch {
        // Ignore errors in increment logic
      }
    }

    return errorResponse(error, request);
  }
}
