// Activity logging database operations

import { getAdminClient } from '@/lib/supabase/admin';
import type { ActivityLog, PublishHistory, UserType } from '@/lib/types/database';
import type { ActivityLogFilters, PaginationParams } from '@/lib/types/api';

const supabase = getAdminClient();

// ============================================
// ACTIVITY LOG OPERATIONS
// ============================================

export interface LogActivityParams {
  siteId: string;
  userId: string;
  userType: UserType;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  request?: Request;
}

/**
 * Log an activity event
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const {
    siteId,
    userId,
    userType,
    action,
    entityType,
    entityId,
    changes,
    request,
  } = params;

  const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request?.headers.get('x-real-ip') ||
    null;

  const userAgent = request?.headers.get('user-agent') || null;

  const { error } = await supabase.from('activity_log').insert({
    site_id: siteId,
    user_id: userId,
    user_type: userType,
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    changes: changes || null,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    // Don't throw - activity logging failures shouldn't break the application
    console.error('Failed to log activity:', error);
  }
}

/**
 * Get activity logs with filters and pagination
 */
export async function getActivityLogs(
  filters: ActivityLogFilters = {},
  pagination: PaginationParams = {}
): Promise<{ data: ActivityLog[]; total: number }> {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('activity_log')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.site_id) {
    query = query.eq('site_id', filters.site_id);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.user_type) {
    query = query.eq('user_type', filters.user_type);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
  };
}

/**
 * Get activity logs for a specific site
 */
export async function getSiteActivityLogs(
  siteId: string,
  pagination: PaginationParams = {}
): Promise<{ data: ActivityLog[]; total: number }> {
  return getActivityLogs({ site_id: siteId }, pagination);
}

/**
 * Get recent activity for a user
 */
export async function getUserRecentActivity(
  userId: string,
  limit = 10
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

// ============================================
// PUBLISH HISTORY OPERATIONS
// ============================================

/**
 * Create a publish history entry
 */
export async function createPublishEntry(
  siteId: string,
  publishedBy: string,
  publisherType: UserType,
  contentSnapshot: Record<string, unknown>,
  notes?: string
): Promise<PublishHistory> {
  const { data, error } = await supabase
    .from('publish_history')
    .insert({
      site_id: siteId,
      published_by: publishedBy,
      publisher_type: publisherType,
      content_snapshot: contentSnapshot,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get publish history for a site
 */
export async function getPublishHistory(
  siteId: string,
  pagination: PaginationParams = {}
): Promise<{ data: PublishHistory[]; total: number }> {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('publish_history')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order('version_number', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
  };
}

/**
 * Get latest published version for a site
 */
export async function getLatestPublishedVersion(
  siteId: string
): Promise<PublishHistory | null> {
  const { data } = await supabase
    .from('publish_history')
    .select('*')
    .eq('site_id', siteId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  return data;
}

/**
 * Get a specific version
 */
export async function getPublishVersion(
  siteId: string,
  versionNumber: number
): Promise<PublishHistory | null> {
  const { data } = await supabase
    .from('publish_history')
    .select('*')
    .eq('site_id', siteId)
    .eq('version_number', versionNumber)
    .single();

  return data;
}

// ============================================
// CONTENT SNAPSHOT HELPERS
// ============================================

/**
 * Create a content snapshot for publishing
 */
export async function createContentSnapshot(
  siteId: string
): Promise<Record<string, unknown>> {
  // Fetch all content in parallel
  const [businessInfo, textContent, collections, images] = await Promise.all([
    supabase.from('business_info').select('*').eq('site_id', siteId).single(),
    supabase.from('text_content').select('*').eq('site_id', siteId).order('sort_order'),
    supabase.from('collections').select('*').eq('site_id', siteId).order('sort_order'),
    supabase.from('images').select('*').eq('site_id', siteId).order('sort_order'),
  ]);

  // Fetch collection items for each collection
  const collectionItems: Record<string, unknown[]> = {};

  if (collections.data) {
    for (const collection of collections.data) {
      const { data: items } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collection.id)
        .order('sort_order');

      collectionItems[collection.collection_key] = items || [];
    }
  }

  return {
    business_info: businessInfo.data,
    text_content: textContent.data || [],
    collections: collections.data?.map((c) => ({
      ...c,
      items: collectionItems[c.collection_key] || [],
    })) || [],
    images: images.data || [],
    snapshot_at: new Date().toISOString(),
  };
}
