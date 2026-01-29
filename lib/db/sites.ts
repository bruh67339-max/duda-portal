// Site database operations

import { getAdminClient } from '@/lib/supabase/admin';
import { NotFoundError, ConflictError } from '@/lib/utils/errors';
import type { Site, SitePermissions } from '@/lib/types/database';
import type { CreateSiteRequest, UpdateSiteRequest, SiteWithClient } from '@/lib/types/api';

const supabase = getAdminClient();

/**
 * Get all sites with optional client info
 */
export async function getAllSites(): Promise<SiteWithClient[]> {
  const { data, error } = await supabase
    .from('sites')
    .select(`
      *,
      client:clients(id, name, email, company)
    `)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as SiteWithClient[];
}

/**
 * Get site by ID
 */
export async function getSiteById(id: string): Promise<Site> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Site not found');
  }

  return data;
}

/**
 * Get site by slug
 */
export async function getSiteBySlug(slug: string): Promise<Site> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    throw new NotFoundError('Site not found');
  }

  return data;
}

/**
 * Get sites for a client
 */
export async function getClientSites(clientId: string): Promise<Site[]> {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('client_id', clientId)
    .neq('status', 'archived')
    .order('name');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Create a new site
 */
export async function createSite(
  input: CreateSiteRequest,
  createdBy: string
): Promise<Site> {
  // Check if slug is unique
  const { data: existing } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', input.slug)
    .single();

  if (existing) {
    throw new ConflictError('Site with this slug already exists');
  }

  const { data, error } = await supabase
    .from('sites')
    .insert({
      ...input,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a site
 */
export async function updateSite(
  id: string,
  input: UpdateSiteRequest
): Promise<Site> {
  // If slug is being changed, check uniqueness
  if (input.slug) {
    const { data: existing } = await supabase
      .from('sites')
      .select('id')
      .eq('slug', input.slug)
      .neq('id', id)
      .single();

    if (existing) {
      throw new ConflictError('Site with this slug already exists');
    }
  }

  // If publishing, set published_at
  const updateData: Record<string, unknown> = { ...input };
  if (input.status === 'published') {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('sites')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Site not found');
  }

  return data;
}

/**
 * Archive a site (soft delete)
 */
export async function archiveSite(id: string): Promise<void> {
  const { error } = await supabase
    .from('sites')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Regenerate API key for a site
 */
export async function regenerateApiKey(id: string): Promise<string> {
  const { data, error } = await supabase
    .from('sites')
    .update({
      api_key: crypto.randomUUID(),
      api_key_created_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('api_key')
    .single();

  if (error || !data) {
    throw new NotFoundError('Site not found');
  }

  return data.api_key;
}

/**
 * Get site permissions
 * Note: Permissions are stored per site, not per client
 */
export async function getSitePermissions(siteId: string, _clientId?: string): Promise<SitePermissions> {
  const { data, error } = await supabase
    .from('site_permissions')
    .select('*')
    .eq('site_id', siteId)
    .single();

  if (error || !data) {
    // Return default permissions if not found (all false)
    return {
      id: '',
      site_id: siteId,
      can_edit_business_info: false,
      can_edit_text: false,
      can_edit_images: false,
      can_edit_collections: false,
      can_add_collection_items: false,
      can_delete_collection_items: false,
      can_reorder_collection_items: false,
      can_publish: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as SitePermissions;
  }

  return data;
}

/**
 * Update site permissions
 */
export async function updateSitePermissions(
  siteId: string,
  permissions: Partial<SitePermissions>
): Promise<SitePermissions> {
  const { data, error } = await supabase
    .from('site_permissions')
    .update(permissions)
    .eq('site_id', siteId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Site permissions not found');
  }

  return data;
}

/**
 * Validate site API key
 */
export async function validateSiteApiKey(
  slug: string,
  apiKey: string
): Promise<Site | null> {
  const { data } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .eq('api_key', apiKey)
    .eq('status', 'published')
    .single();

  return data;
}
