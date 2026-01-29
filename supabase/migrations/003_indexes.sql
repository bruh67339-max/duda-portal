-- Database Indexes for Performance
-- Run after 002_tables.sql

-- ============================================
-- ADMIN USERS INDEXES
-- ============================================
CREATE UNIQUE INDEX idx_admin_users_email ON admin_users(LOWER(email));

-- ============================================
-- CLIENTS INDEXES
-- ============================================
CREATE UNIQUE INDEX idx_clients_email ON clients(LOWER(email));

-- ============================================
-- SITES INDEXES
-- ============================================
CREATE INDEX idx_sites_slug ON sites(slug);
CREATE INDEX idx_sites_client_id ON sites(client_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_api_key ON sites(api_key);
CREATE INDEX idx_sites_created_by ON sites(created_by);

-- ============================================
-- BUSINESS INFO INDEXES
-- ============================================
CREATE INDEX idx_business_info_site_id ON business_info(site_id);

-- ============================================
-- TEXT CONTENT INDEXES
-- ============================================
CREATE INDEX idx_text_content_site_id ON text_content(site_id);
CREATE INDEX idx_text_content_key ON text_content(site_id, content_key);

-- ============================================
-- COLLECTIONS INDEXES
-- ============================================
CREATE INDEX idx_collections_site_id ON collections(site_id);
CREATE INDEX idx_collections_key ON collections(site_id, collection_key);

-- ============================================
-- COLLECTION ITEMS INDEXES
-- ============================================
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_sort ON collection_items(collection_id, sort_order);

-- ============================================
-- IMAGES INDEXES
-- ============================================
CREATE INDEX idx_images_site_id ON images(site_id);
CREATE INDEX idx_images_key ON images(site_id, image_key);

-- ============================================
-- SITE PERMISSIONS INDEXES
-- ============================================
CREATE INDEX idx_site_permissions_site_id ON site_permissions(site_id);

-- ============================================
-- ACTIVITY LOG INDEXES
-- ============================================
CREATE INDEX idx_activity_log_site_id ON activity_log(site_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action);

-- ============================================
-- SECURITY LOGS INDEXES
-- ============================================
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_ip ON security_logs(ip_address);

-- ============================================
-- PUBLISH HISTORY INDEXES
-- ============================================
CREATE INDEX idx_publish_history_site_id ON publish_history(site_id);
CREATE INDEX idx_publish_history_version ON publish_history(site_id, version_number DESC);

-- ============================================
-- REFRESH TOKENS INDEXES
-- ============================================
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, user_type);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;
