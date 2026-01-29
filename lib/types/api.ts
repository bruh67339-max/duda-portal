// API Request/Response types

import type {
  Site,
  Client,
  BusinessInfo,
  TextContent,
  Collection,
  CollectionItem,
  Image,
  SitePermissions,
  ActivityLog,
  SecurityLog,
  PublishHistory,
  CollectionFieldSchema,
} from './database';

// ============================================
// COMMON TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  user_type: 'admin' | 'client';
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    type: 'admin' | 'client';
    role?: string;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface PasswordResetRequest {
  email: string;
  user_type: 'admin' | 'client';
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

// ============================================
// ADMIN API TYPES
// ============================================

// Sites
export interface CreateSiteRequest {
  name: string;
  slug: string;
  replit_url?: string;
  custom_domain?: string;
  client_id?: string;
}

export interface UpdateSiteRequest {
  name?: string;
  slug?: string;
  replit_url?: string;
  custom_domain?: string;
  client_id?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface SiteWithClient extends Site {
  client?: Pick<Client, 'id' | 'name' | 'email' | 'company'> | null;
}

// Clients
export interface CreateClientRequest {
  email: string;
  name: string;
  company?: string;
  phone?: string;
  password?: string; // If not provided, generates invite
}

export interface UpdateClientRequest {
  name?: string;
  company?: string;
  phone?: string;
  is_active?: boolean;
}

// Text Fields
export interface CreateTextFieldRequest {
  content_key: string;
  label: string;
  content?: string;
  content_type?: 'text' | 'rich_text' | 'html';
  max_length?: number;
  placeholder?: string;
  sort_order?: number;
}

export interface UpdateTextFieldRequest {
  label?: string;
  content?: string;
  content_type?: 'text' | 'rich_text' | 'html';
  max_length?: number;
  placeholder?: string;
  sort_order?: number;
}

// Collections
export interface CreateCollectionRequest {
  collection_key: string;
  label: string;
  description?: string;
  item_schema: Record<string, CollectionFieldSchema>;
  can_add?: boolean;
  can_delete?: boolean;
  can_reorder?: boolean;
  max_items?: number;
  sort_order?: number;
}

export interface UpdateCollectionRequest {
  label?: string;
  description?: string;
  item_schema?: Record<string, CollectionFieldSchema>;
  can_add?: boolean;
  can_delete?: boolean;
  can_reorder?: boolean;
  max_items?: number;
  sort_order?: number;
}

// Images
export interface CreateImageSlotRequest {
  image_key: string;
  label: string;
  description?: string;
  recommended_width?: number;
  recommended_height?: number;
  max_file_size_kb?: number;
  sort_order?: number;
}

export interface UpdateImageSlotRequest {
  label?: string;
  description?: string;
  url?: string;
  alt_text?: string;
  recommended_width?: number;
  recommended_height?: number;
  max_file_size_kb?: number;
  sort_order?: number;
}

// Permissions
export interface UpdatePermissionsRequest {
  can_edit_business_info?: boolean;
  can_edit_text?: boolean;
  can_edit_images?: boolean;
  can_edit_collections?: boolean;
  can_add_collection_items?: boolean;
  can_delete_collection_items?: boolean;
  can_reorder_collection_items?: boolean;
  can_publish?: boolean;
}

// ============================================
// CLIENT API TYPES
// ============================================

export interface UpdateBusinessInfoRequest {
  business_name?: string;
  phone?: string;
  email?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  hours?: Record<string, string>;
  social_links?: Record<string, string>;
}

export interface UpdateTextContentRequest {
  content: string;
}

export interface CreateCollectionItemRequest {
  data: Record<string, unknown>;
  sort_order?: number;
  is_visible?: boolean;
}

export interface UpdateCollectionItemRequest {
  data?: Record<string, unknown>;
  sort_order?: number;
  is_visible?: boolean;
}

export interface ReorderCollectionItemsRequest {
  item_ids: string[];
}

export interface PublishRequest {
  notes?: string;
}

// ============================================
// PUBLIC API TYPES
// ============================================

export interface PublicSiteContent {
  site: {
    name: string;
    slug: string;
  };
  business: {
    business_name: string | null;
    phone: string | null;
    email: string | null;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      country: string;
    };
    hours: Record<string, string>;
    social: Record<string, string>;
    logo_url: string | null;
  } | null;
  text: Record<string, string>;
  collections: Record<string, Array<{ id: string } & Record<string, unknown>>>;
  images: Record<string, { url: string | null; alt: string | null }>;
}

// ============================================
// ACTIVITY & LOGS TYPES
// ============================================

export interface ActivityLogFilters {
  site_id?: string;
  user_id?: string;
  user_type?: 'admin' | 'client';
  action?: string;
  from_date?: string;
  to_date?: string;
}

export interface SecurityLogFilters {
  event_type?: string;
  user_id?: string;
  severity?: 'info' | 'warning' | 'critical';
  from_date?: string;
  to_date?: string;
  ip_address?: string;
}
