// Database entity types
// These match the Supabase table schemas

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'editor';
  is_active: boolean;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  last_login_at: string | null;
  password_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  is_active: boolean;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  password_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  slug: string;
  replit_url: string | null;
  custom_domain: string | null;
  client_id: string | null;
  created_by: string | null;
  status: 'draft' | 'published' | 'archived';
  api_key: string;
  api_key_created_at: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessInfo {
  id: string;
  site_id: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_country: string;
  hours: Record<string, string>;
  social_links: Record<string, string>;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TextContent {
  id: string;
  site_id: string;
  content_key: string;
  label: string;
  content: string;
  content_type: 'text' | 'rich_text' | 'html';
  max_length: number | null;
  placeholder: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  site_id: string;
  collection_key: string;
  label: string;
  description: string | null;
  item_schema: Record<string, CollectionFieldSchema>;
  can_add: boolean;
  can_delete: boolean;
  can_reorder: boolean;
  max_items: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionFieldSchema {
  type: 'text' | 'textarea' | 'number' | 'select' | 'image' | 'boolean';
  label: string;
  required?: boolean;
  max_length?: number;
  options?: string[];
  placeholder?: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  data: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  site_id: string;
  image_key: string;
  label: string;
  description: string | null;
  url: string | null;
  alt_text: string | null;
  recommended_width: number | null;
  recommended_height: number | null;
  max_file_size_kb: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SitePermissions {
  id: string;
  site_id: string;
  can_edit_business_info: boolean;
  can_edit_text: boolean;
  can_edit_images: boolean;
  can_edit_collections: boolean;
  can_add_collection_items: boolean;
  can_delete_collection_items: boolean;
  can_reorder_collection_items: boolean;
  can_publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  site_id: string;
  user_id: string | null;
  user_type: 'client' | 'admin' | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SecurityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  user_type: 'client' | 'admin' | null;
  ip_address: string | null;
  user_agent: string | null;
  endpoint: string | null;
  details: Record<string, unknown> | null;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export interface PublishHistory {
  id: string;
  site_id: string;
  published_by: string | null;
  publisher_type: 'client' | 'admin' | null;
  version_number: number;
  content_snapshot: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  user_type: 'client' | 'admin';
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

// User type for auth context
export type UserType = 'admin' | 'client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: UserType;
  role?: 'super_admin' | 'admin' | 'editor'; // Only for admins
}
