// Client database operations

import { getAdminClient } from '@/lib/supabase/admin';
import { NotFoundError, ConflictError } from '@/lib/utils/errors';
import type { Client } from '@/lib/types/database';
import type { CreateClientRequest, UpdateClientRequest } from '@/lib/types/api';

const supabase = getAdminClient();

/**
 * Get all clients
 */
export async function getAllClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get active clients
 */
export async function getActiveClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get client by ID
 */
export async function getClientById(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Client not found');
  }

  return data;
}

/**
 * Get client by email
 */
export async function getClientByEmail(email: string): Promise<Client | null> {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .ilike('email', email)
    .single();

  return data;
}

/**
 * Create a new client
 * Note: Password is handled by Supabase Auth, not stored in this table
 */
export async function createClient(
  input: CreateClientRequest,
  authUserId: string
): Promise<Client> {
  // Check if email is unique
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .ilike('email', input.email)
    .single();

  if (existing) {
    throw new ConflictError('Client with this email already exists');
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      id: authUserId, // Use the auth user ID
      email: input.email.toLowerCase(),
      name: input.name,
      company: input.company || null,
      phone: input.phone || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a client
 */
export async function updateClient(
  id: string,
  input: UpdateClientRequest
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundError('Client not found');
  }

  return data;
}

/**
 * Deactivate a client (soft delete)
 */
export async function deactivateClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Reactivate a client
 */
export async function reactivateClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ is_active: true })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Get client with assigned sites count
 */
export async function getClientWithSiteCount(
  id: string
): Promise<Client & { site_count: number }> {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    throw new NotFoundError('Client not found');
  }

  const { count } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)
    .neq('status', 'archived');

  return {
    ...client,
    site_count: count || 0,
  };
}
