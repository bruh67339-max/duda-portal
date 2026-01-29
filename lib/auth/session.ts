// Session and token management
// SECURITY: Handle token creation, refresh, and revocation

import { getAdminClient } from '@/lib/supabase/admin';
import { createHash, randomUUID } from 'crypto';
import type { UserType } from '@/lib/types/database';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomUUID() + randomUUID();
}

/**
 * Create a refresh token and store its hash in the database
 */
export async function createRefreshToken(
  userId: string,
  userType: UserType
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);

  const supabase = getAdminClient();

  const { error } = await (supabase.from('refresh_tokens') as any).insert({
    user_id: userId,
    user_type: userType,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error('Failed to create refresh token');
  }

  return { token, expiresAt };
}

/**
 * Validate a refresh token and return user info if valid
 */
export async function validateRefreshToken(
  token: string
): Promise<{ userId: string; userType: UserType } | null> {
  const tokenHash = hashToken(token);
  const supabase = getAdminClient();

  const { data: tokenRecord, error } = await supabase
    .from('refresh_tokens')
    .select('id, user_id, user_type, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single() as { data: { id: string; user_id: string; user_type: string; expires_at: string; revoked_at: string | null } | null; error: Error | null };

  if (error || !tokenRecord) {
    return null;
  }

  // Check if token is revoked
  if (tokenRecord.revoked_at) {
    return null;
  }

  // Check if token is expired
  if (new Date(tokenRecord.expires_at) < new Date()) {
    return null;
  }

  // Update last_used_at
  await (supabase.from('refresh_tokens') as any)
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRecord.id);

  return {
    userId: tokenRecord.user_id,
    userType: tokenRecord.user_type as UserType,
  };
}

/**
 * Rotate refresh token (invalidate old, create new)
 * This provides additional security against token theft
 */
export async function rotateRefreshToken(
  oldToken: string
): Promise<{ token: string; expiresAt: Date; userId: string; userType: UserType } | null> {
  const tokenHash = hashToken(oldToken);
  const supabase = getAdminClient();

  // Get and validate old token
  const { data: tokenRecord, error } = await supabase
    .from('refresh_tokens')
    .select('id, user_id, user_type, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single() as { data: { id: string; user_id: string; user_type: string; expires_at: string; revoked_at: string | null } | null; error: Error | null };

  if (error || !tokenRecord || tokenRecord.revoked_at) {
    return null;
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return null;
  }

  // Revoke old token
  await (supabase.from('refresh_tokens') as any)
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenRecord.id);

  // Create new token
  const newToken = await createRefreshToken(
    tokenRecord.user_id,
    tokenRecord.user_type as UserType
  );

  return {
    ...newToken,
    userId: tokenRecord.user_id,
    userType: tokenRecord.user_type as UserType,
  };
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const supabase = getAdminClient();

  await (supabase.from('refresh_tokens') as any)
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);
}

/**
 * Revoke all refresh tokens for a user
 * Used when password is changed or account is compromised
 */
export async function revokeAllUserTokens(
  userId: string,
  userType: UserType
): Promise<void> {
  const supabase = getAdminClient();

  await (supabase.from('refresh_tokens') as any)
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('user_type', userType)
    .is('revoked_at', null);
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const supabase = getAdminClient();

  const { data, error } = await (supabase.from('refresh_tokens') as any)
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('Failed to cleanup expired tokens:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(
  userId: string,
  userType: UserType
): Promise<void> {
  const supabase = getAdminClient();
  const table = userType === 'admin' ? 'admin_users' : 'clients';

  await (supabase.from(table) as any)
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Increment failed login attempts for a client
 */
export async function incrementFailedLoginAttempts(
  userId: string
): Promise<{ attempts: number; lockedUntil: Date | null }> {
  const supabase = getAdminClient();

  // Get current attempts
  const { data: client } = await supabase
    .from('clients')
    .select('failed_login_attempts')
    .eq('id', userId)
    .single() as { data: { failed_login_attempts: number } | null };

  const attempts = (client?.failed_login_attempts || 0) + 1;
  let lockedUntil: Date | null = null;

  // Lock account after 5 failed attempts for 15 minutes
  if (attempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await (supabase.from('clients') as any)
    .update({
      failed_login_attempts: attempts,
      locked_until: lockedUntil?.toISOString() || null,
    })
    .eq('id', userId);

  return { attempts, lockedUntil };
}

/**
 * Reset failed login attempts
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  const supabase = getAdminClient();

  await (supabase.from('clients') as any)
    .update({
      failed_login_attempts: 0,
      locked_until: null,
    })
    .eq('id', userId);
}

// Export token expiry for use in auth endpoints
export { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY };
