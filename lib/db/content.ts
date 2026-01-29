// Content database operations (text content, business info, images)

import { getAdminClient } from '@/lib/supabase/admin';
import { NotFoundError, ConflictError } from '@/lib/utils/errors';
import type { TextContent, BusinessInfo, Image } from '@/lib/types/database';
import type {
  CreateTextFieldRequest,
  UpdateTextFieldRequest,
  UpdateBusinessInfoRequest,
  CreateImageSlotRequest,
  UpdateImageSlotRequest,
} from '@/lib/types/api';

const supabase = getAdminClient();

// ============================================
// TEXT CONTENT OPERATIONS
// ============================================

/**
 * Get all text content for a site
 */
export async function getTextContent(siteId: string): Promise<TextContent[]> {
  const { data, error } = await supabase
    .from('text_content')
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get text content by key
 */
export async function getTextContentByKey(
  siteId: string,
  contentKey: string
): Promise<TextContent> {
  const { data, error } = await supabase
    .from('text_content')
    .select('*')
    .eq('site_id', siteId)
    .eq('content_key', contentKey)
    .single();

  if (error || !data) {
    throw new NotFoundError('Text content not found');
  }

  return data;
}

/**
 * Create text content field
 */
export async function createTextField(
  siteId: string,
  input: CreateTextFieldRequest
): Promise<TextContent> {
  // Check if key already exists
  const { data: existing } = await supabase
    .from('text_content')
    .select('id')
    .eq('site_id', siteId)
    .eq('content_key', input.content_key)
    .single();

  if (existing) {
    throw new ConflictError('Text field with this key already exists');
  }

  const { data, error } = await supabase
    .from('text_content')
    .insert({
      site_id: siteId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update text content field (admin)
 */
export async function updateTextField(
  id: string,
  input: UpdateTextFieldRequest
): Promise<TextContent> {
  const { data, error } = await supabase
    .from('text_content')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Text content not found');
  }

  return data;
}

/**
 * Update text content (client - only content field)
 */
export async function updateTextContent(
  siteId: string,
  contentKey: string,
  content: string
): Promise<TextContent> {
  // Get the field to check max_length
  const { data: existing } = await supabase
    .from('text_content')
    .select('max_length')
    .eq('site_id', siteId)
    .eq('content_key', contentKey)
    .single();

  if (!existing) {
    throw new NotFoundError('Text content not found');
  }

  // Validate max_length
  if (existing.max_length && content.length > existing.max_length) {
    throw new Error(`Content exceeds maximum length of ${existing.max_length} characters`);
  }

  const { data, error } = await supabase
    .from('text_content')
    .update({ content })
    .eq('site_id', siteId)
    .eq('content_key', contentKey)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete text content field
 */
export async function deleteTextField(id: string): Promise<void> {
  const { error } = await supabase
    .from('text_content')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// ============================================
// BUSINESS INFO OPERATIONS
// ============================================

/**
 * Get business info for a site
 */
export async function getBusinessInfo(siteId: string): Promise<BusinessInfo | null> {
  const { data, error } = await supabase
    .from('business_info')
    .select('*')
    .eq('site_id', siteId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Update business info
 */
export async function updateBusinessInfo(
  siteId: string,
  input: UpdateBusinessInfoRequest
): Promise<BusinessInfo> {
  const { data, error } = await supabase
    .from('business_info')
    .update(input)
    .eq('site_id', siteId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Business info not found');
  }

  return data;
}

// ============================================
// IMAGE OPERATIONS
// ============================================

/**
 * Get all images for a site
 */
export async function getImages(siteId: string): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get image by key
 */
export async function getImageByKey(
  siteId: string,
  imageKey: string
): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('site_id', siteId)
    .eq('image_key', imageKey)
    .single();

  if (error || !data) {
    throw new NotFoundError('Image slot not found');
  }

  return data;
}

/**
 * Create image slot
 */
export async function createImageSlot(
  siteId: string,
  input: CreateImageSlotRequest
): Promise<Image> {
  // Check if key already exists
  const { data: existing } = await supabase
    .from('images')
    .select('id')
    .eq('site_id', siteId)
    .eq('image_key', input.image_key)
    .single();

  if (existing) {
    throw new ConflictError('Image slot with this key already exists');
  }

  const { data, error } = await supabase
    .from('images')
    .insert({
      site_id: siteId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update image slot (admin)
 */
export async function updateImageSlot(
  id: string,
  input: UpdateImageSlotRequest
): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Image slot not found');
  }

  return data;
}

/**
 * Update image URL and alt text (client)
 */
export async function updateImageContent(
  siteId: string,
  imageKey: string,
  url: string,
  altText?: string
): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .update({ url, alt_text: altText || null })
    .eq('site_id', siteId)
    .eq('image_key', imageKey)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Image slot not found');
  }

  return data;
}

/**
 * Delete image slot
 */
export async function deleteImageSlot(id: string): Promise<void> {
  const { error } = await supabase.from('images').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
