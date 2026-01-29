-- Database Tables for Client Portal
-- Run after 001_extensions.sql

-- ============================================
-- ADMIN USERS TABLE
-- Agency admin/staff accounts
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLIENTS TABLE
-- End-user client accounts
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SITES TABLE
-- Website registrations
-- ============================================
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  replit_url VARCHAR(500),
  custom_domain VARCHAR(255),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by UUID REFERENCES admin_users(id),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  api_key UUID UNIQUE DEFAULT uuid_generate_v4(),
  api_key_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9][a-z0-9\-]*[a-z0-9]$' AND LENGTH(slug) >= 2)
);

-- ============================================
-- BUSINESS INFO TABLE
-- One-to-one with sites
-- ============================================
CREATE TABLE business_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  address_country VARCHAR(100) DEFAULT 'USA',
  hours JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  logo_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEXT CONTENT TABLE
-- Editable text blocks
-- ============================================
CREATE TABLE text_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  content_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'rich_text', 'html')),
  max_length INTEGER CHECK (max_length IS NULL OR max_length > 0),
  placeholder VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(site_id, content_key),
  CONSTRAINT valid_content_key CHECK (content_key ~ '^[a-z][a-z0-9_]*$')
);

-- ============================================
-- COLLECTIONS TABLE
-- Collection definitions (e.g., menu_items)
-- ============================================
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  collection_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  item_schema JSONB NOT NULL,
  can_add BOOLEAN DEFAULT true,
  can_delete BOOLEAN DEFAULT true,
  can_reorder BOOLEAN DEFAULT true,
  max_items INTEGER CHECK (max_items IS NULL OR max_items > 0),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(site_id, collection_key),
  CONSTRAINT valid_collection_key CHECK (collection_key ~ '^[a-z][a-z0-9_]*$')
);

-- ============================================
-- COLLECTION ITEMS TABLE
-- Items within collections
-- ============================================
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- IMAGES TABLE
-- Image slot definitions
-- ============================================
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  image_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  alt_text VARCHAR(255),
  recommended_width INTEGER,
  recommended_height INTEGER,
  max_file_size_kb INTEGER DEFAULT 2048,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(site_id, image_key),
  CONSTRAINT valid_image_key CHECK (image_key ~ '^[a-z][a-z0-9_]*$')
);

-- ============================================
-- SITE PERMISSIONS TABLE
-- Client permissions per site
-- ============================================
CREATE TABLE site_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  can_edit_business_info BOOLEAN DEFAULT true,
  can_edit_text BOOLEAN DEFAULT true,
  can_edit_images BOOLEAN DEFAULT true,
  can_edit_collections BOOLEAN DEFAULT true,
  can_add_collection_items BOOLEAN DEFAULT true,
  can_delete_collection_items BOOLEAN DEFAULT false,
  can_reorder_collection_items BOOLEAN DEFAULT true,
  can_publish BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOG TABLE
-- Content change tracking
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID,
  user_type VARCHAR(20) CHECK (user_type IN ('client', 'admin')),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECURITY LOGS TABLE
-- Security audit trail
-- ============================================
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID,
  user_type VARCHAR(20),
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(255),
  details JSONB,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PUBLISH HISTORY TABLE
-- Version control for published content
-- ============================================
CREATE TABLE publish_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  published_by UUID,
  publisher_type VARCHAR(20) CHECK (publisher_type IN ('client', 'admin')),
  version_number INTEGER NOT NULL,
  content_snapshot JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REFRESH TOKENS TABLE
-- Token management for security
-- ============================================
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'admin')),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);
