-- Database Triggers
-- Run after 005_rls_policies.sql

-- ============================================
-- UPDATED_AT TRIGGERS
-- Auto-update timestamp on record changes
-- ============================================

CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_business_info_updated_at
  BEFORE UPDATE ON business_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_text_content_updated_at
  BEFORE UPDATE ON text_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_collection_items_updated_at
  BEFORE UPDATE ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_site_permissions_updated_at
  BEFORE UPDATE ON site_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PUBLISH VERSION TRIGGER
-- Auto-increment version number on publish
-- ============================================

CREATE TRIGGER trigger_set_publish_version
  BEFORE INSERT ON publish_history
  FOR EACH ROW
  EXECUTE FUNCTION set_publish_version();

-- ============================================
-- COLLECTION ITEM LIMIT TRIGGER
-- Prevent exceeding max_items
-- ============================================

CREATE TRIGGER trigger_check_collection_item_limit
  BEFORE INSERT ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION check_collection_item_limit();

-- ============================================
-- AUTO-CREATE SITE PERMISSIONS
-- When a site is created, auto-create default permissions
-- ============================================

CREATE OR REPLACE FUNCTION create_default_site_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO site_permissions (site_id)
  VALUES (NEW.id)
  ON CONFLICT (site_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_site_permissions
  AFTER INSERT ON sites
  FOR EACH ROW
  EXECUTE FUNCTION create_default_site_permissions();

-- ============================================
-- AUTO-CREATE BUSINESS INFO
-- When a site is created, auto-create empty business info
-- ============================================

CREATE OR REPLACE FUNCTION create_default_business_info()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO business_info (site_id)
  VALUES (NEW.id)
  ON CONFLICT (site_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_business_info
  AFTER INSERT ON sites
  FOR EACH ROW
  EXECUTE FUNCTION create_default_business_info();
