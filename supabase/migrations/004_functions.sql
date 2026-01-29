-- Helper Functions for RLS and Business Logic
-- Run after 003_indexes.sql

-- ============================================
-- CHECK IF USER IS ADMIN
-- Used in RLS policies
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHECK IF USER IS SUPER ADMIN
-- Used for elevated operations
-- ============================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHECK IF CLIENT HAS SITE ACCESS
-- Verifies client is assigned to site
-- ============================================
CREATE OR REPLACE FUNCTION client_has_site_access(site_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sites
    WHERE id = site_uuid
    AND client_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET SITE ID FROM COLLECTION
-- Helper for collection item policies
-- ============================================
CREATE OR REPLACE FUNCTION get_site_from_collection(collection_uuid UUID)
RETURNS UUID AS $$
DECLARE
  site_uuid UUID;
BEGIN
  SELECT site_id INTO site_uuid
  FROM collections
  WHERE id = collection_uuid;
  RETURN site_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-INCREMENT PUBLISH VERSION
-- Trigger function for publish_history
-- ============================================
CREATE OR REPLACE FUNCTION set_publish_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number := COALESCE(
    (SELECT MAX(version_number) + 1 FROM publish_history WHERE site_id = NEW.site_id),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-UPDATE TIMESTAMP
-- Generic updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CHECK COLLECTION ITEM LIMITS
-- Prevents exceeding max_items
-- ============================================
CREATE OR REPLACE FUNCTION check_collection_item_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT max_items INTO max_allowed
  FROM collections
  WHERE id = NEW.collection_id;

  IF max_allowed IS NOT NULL THEN
    SELECT COUNT(*) INTO current_count
    FROM collection_items
    WHERE collection_id = NEW.collection_id;

    IF current_count >= max_allowed THEN
      RAISE EXCEPTION 'Collection item limit reached (max: %)', max_allowed;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CHECK SITE PERMISSIONS FOR CLIENT ACTION
-- Used to verify specific permissions
-- ============================================
CREATE OR REPLACE FUNCTION check_site_permission(
  site_uuid UUID,
  permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT %I FROM site_permissions WHERE site_id = $1',
    permission_name
  )
  INTO has_permission
  USING site_uuid;

  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
