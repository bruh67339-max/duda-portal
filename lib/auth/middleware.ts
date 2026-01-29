// Authentication middleware helpers
// CRITICAL: Verify auth on all protected routes

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors';
import type { AuthUser, UserType } from '@/lib/types/database';

export interface AuthContext {
  user: AuthUser;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Verify authentication and return user context
 * Use this in API routes that require authentication
 * Supports both Bearer token (for external clients) and cookie-based session (for browser)
 */
export async function verifyAuth(request: Request): Promise<AuthContext> {
  // Create Supabase client (handles cookies automatically)
  const supabase = await createClient();

  // Check for Bearer token first (external API clients)
  const authHeader = request.headers.get('authorization');
  let user;
  let error;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      error = result.error;
    }
  }

  // Fall back to cookie-based session (browser requests)
  if (!user) {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    error = result.error;
  }

  if (error || !user) {
    throw new UnauthorizedError('Invalid or expired session');
  }

  // Determine user type by checking both tables
  const adminClient = getAdminClient();

  // Check if user is admin
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, email, name, role, is_active')
    .eq('id', user.id)
    .single() as { data: { id: string; email: string; name: string; role: 'super_admin' | 'admin' | 'editor'; is_active: boolean } | null };

  if (adminUser) {
    if (!adminUser.is_active) {
      throw new ForbiddenError('Account is deactivated');
    }

    return {
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        type: 'admin' as UserType,
        role: adminUser.role,
      },
      supabase,
    };
  }

  // Check if user is client
  const { data: clientUser } = await adminClient
    .from('clients')
    .select('id, email, name, is_active, locked_until')
    .eq('id', user.id)
    .single() as { data: { id: string; email: string; name: string; is_active: boolean; locked_until: string | null } | null };

  if (clientUser) {
    if (!clientUser.is_active) {
      throw new ForbiddenError('Account is deactivated');
    }

    if (
      clientUser.locked_until &&
      new Date(clientUser.locked_until) > new Date()
    ) {
      throw new ForbiddenError('Account is temporarily locked');
    }

    return {
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        type: 'client' as UserType,
      },
      supabase,
    };
  }

  throw new UnauthorizedError('User not found');
}

/**
 * Verify that user is an admin
 */
export async function verifyAdmin(request: Request): Promise<AuthContext> {
  const context = await verifyAuth(request);

  if (context.user.type !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return context;
}

/**
 * Verify that user is a super admin
 */
export async function verifySuperAdmin(request: Request): Promise<AuthContext> {
  const context = await verifyAdmin(request);

  if (context.user.role !== 'super_admin') {
    throw new ForbiddenError('Super admin access required');
  }

  return context;
}

/**
 * Verify that user is a client
 */
export async function verifyClient(request: Request): Promise<AuthContext> {
  const context = await verifyAuth(request);

  if (context.user.type !== 'client') {
    throw new ForbiddenError('Client access required');
  }

  return context;
}

/**
 * Verify that client has access to a specific site
 */
export async function verifyClientSiteAccess(
  request: Request,
  siteSlug: string
): Promise<AuthContext & { siteId: string }> {
  const context = await verifyAuth(request);

  const adminClient = getAdminClient();

  // Get site and verify access
  const { data: site, error } = await adminClient
    .from('sites')
    .select('id, client_id')
    .eq('slug', siteSlug)
    .single() as { data: { id: string; client_id: string | null } | null; error: Error | null };

  if (error || !site) {
    throw new ForbiddenError('Site not found');
  }

  // Admins can access any site
  if (context.user.type === 'admin') {
    return { ...context, siteId: site.id };
  }

  // Clients can only access their assigned sites
  if (site.client_id !== context.user.id) {
    throw new ForbiddenError('Access denied to this site');
  }

  return { ...context, siteId: site.id };
}

/**
 * Verify admin access to a specific site
 */
export async function verifyAdminSiteAccess(
  request: Request,
  siteId: string
): Promise<AuthContext & { siteId: string }> {
  const context = await verifyAdmin(request);

  const adminClient = getAdminClient();

  // Verify site exists
  const { data: site, error } = await adminClient
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .single() as { data: { id: string } | null; error: Error | null };

  if (error || !site) {
    throw new ForbiddenError('Site not found');
  }

  return { ...context, siteId: site.id };
}
