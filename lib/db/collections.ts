// Collection database operations

import { getAdminClient } from '@/lib/supabase/admin';
import { NotFoundError, ConflictError, ValidationError } from '@/lib/utils/errors';
import type { Collection, CollectionItem } from '@/lib/types/database';
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CreateCollectionItemRequest,
  UpdateCollectionItemRequest,
} from '@/lib/types/api';

const supabase = getAdminClient();

// ============================================
// COLLECTION OPERATIONS
// ============================================

/**
 * Get all collections for a site
 */
export async function getCollections(siteId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get collection by key
 */
export async function getCollectionByKey(
  siteId: string,
  collectionKey: string
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('site_id', siteId)
    .eq('collection_key', collectionKey)
    .single();

  if (error || !data) {
    throw new NotFoundError('Collection not found');
  }

  return data;
}

/**
 * Get collection by ID
 */
export async function getCollectionById(id: string): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Collection not found');
  }

  return data;
}

/**
 * Create a collection
 */
export async function createCollection(
  siteId: string,
  input: CreateCollectionRequest
): Promise<Collection> {
  // Check if key already exists
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('site_id', siteId)
    .eq('collection_key', input.collection_key)
    .single();

  if (existing) {
    throw new ConflictError('Collection with this key already exists');
  }

  const { data, error } = await supabase
    .from('collections')
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
 * Update a collection
 */
export async function updateCollection(
  id: string,
  input: UpdateCollectionRequest
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Collection not found');
  }

  return data;
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// ============================================
// COLLECTION ITEM OPERATIONS
// ============================================

/**
 * Get all items in a collection
 */
export async function getCollectionItems(
  collectionId: string
): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('sort_order');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get collection items by collection key
 */
export async function getCollectionItemsByKey(
  siteId: string,
  collectionKey: string
): Promise<CollectionItem[]> {
  const collection = await getCollectionByKey(siteId, collectionKey);
  return getCollectionItems(collection.id);
}

/**
 * Get a single collection item
 */
export async function getCollectionItem(id: string): Promise<CollectionItem> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Collection item not found');
  }

  return data;
}

/**
 * Create a collection item
 */
export async function createCollectionItem(
  collectionId: string,
  input: CreateCollectionItemRequest
): Promise<CollectionItem> {
  // Get collection to check max_items
  const { data: collection } = await supabase
    .from('collections')
    .select('max_items')
    .eq('id', collectionId)
    .single();

  if (collection?.max_items) {
    const { count } = await supabase
      .from('collection_items')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);

    if (count && count >= collection.max_items) {
      throw new ValidationError(`Collection is at maximum capacity (${collection.max_items} items)`);
    }
  }

  // If no sort_order provided, add to end
  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const { data: lastItem } = await supabase
      .from('collection_items')
      .select('sort_order')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    sortOrder = (lastItem?.sort_order ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      data: input.data,
      sort_order: sortOrder,
      is_visible: input.is_visible ?? true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a collection item
 */
export async function updateCollectionItem(
  id: string,
  input: UpdateCollectionItemRequest
): Promise<CollectionItem> {
  const { data, error } = await supabase
    .from('collection_items')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Collection item not found');
  }

  return data;
}

/**
 * Delete a collection item
 */
export async function deleteCollectionItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Reorder collection items
 */
export async function reorderCollectionItems(
  collectionId: string,
  itemIds: string[]
): Promise<CollectionItem[]> {
  // Verify all items belong to the collection
  const { data: items } = await supabase
    .from('collection_items')
    .select('id')
    .eq('collection_id', collectionId);

  const existingIds = new Set(items?.map((i: any) => i.id) || []);

  for (const id of itemIds) {
    if (!existingIds.has(id)) {
      throw new ValidationError(`Item ${id} does not belong to this collection`);
    }
  }

  // Update sort orders
  const updates = itemIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    await supabase
      .from('collection_items')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id);
  }

  // Return updated items
  return getCollectionItems(collectionId);
}

/**
 * Get collection with items
 */
export async function getCollectionWithItems(
  siteId: string,
  collectionKey: string
): Promise<Collection & { items: CollectionItem[] }> {
  const collection = await getCollectionByKey(siteId, collectionKey);
  const items = await getCollectionItems(collection.id);

  return {
    ...collection,
    items,
  };
}
