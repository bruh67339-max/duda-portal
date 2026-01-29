// GET /api/admin/security-logs - List security logs (super_admin only)

import { NextRequest } from 'next/server';
import { verifySuperAdmin } from '@/lib/auth/middleware';
import { getAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';
import { validateInput, securityLogFilterSchema, paginationSchema } from '@/lib/security/validation';
import { paginatedResponse, errorResponse } from '@/lib/utils/response';
import { RateLimitError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    await verifySuperAdmin(request);

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit('admin', ip);
    if (!rateLimitResult.success) {
      throw new RateLimitError();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = validateInput(securityLogFilterSchema, {
      event_type: searchParams.get('event_type') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      severity: searchParams.get('severity') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      ip_address: searchParams.get('ip_address') || undefined,
    });

    const pagination = validateInput(paginationSchema, {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const supabase = getAdminClient();

    // Build query
    let query = supabase
      .from('security_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    if (filters.ip_address) {
      query = query.eq('ip_address', filters.ip_address);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return paginatedResponse(data || [], count || 0, page, limit);
  } catch (error) {
    return errorResponse(error, request);
  }
}
