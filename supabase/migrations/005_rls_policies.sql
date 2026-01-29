-- Row Level Security Policies
-- Run after 004_functions.sql
-- CRITICAL: Enables data access control at the database level

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN USERS POLICIES
-- ============================================
-- Admins can view all admin users
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT TO authenticated
  USING (is_admin());

-- Only super_admins can modify admin users
CREATE POLICY "Super admins can manage admin users" ON admin_users
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================
-- CLIENTS POLICIES
-- ============================================
-- Admins can view all clients
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admins can manage clients
CREATE POLICY "Admins can manage clients" ON clients
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their own record
CREATE POLICY "Clients can view self" ON clients
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Clients can update their own non-sensitive fields
CREATE POLICY "Clients can update self" ON clients
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- SITES POLICIES
-- ============================================
-- Admins have full access to sites
CREATE POLICY "Admins full access to sites" ON sites
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their assigned sites
CREATE POLICY "Clients can view own sites" ON sites
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- ============================================
-- BUSINESS INFO POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to business_info" ON business_info
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their site's business info
CREATE POLICY "Clients can view own site business_info" ON business_info
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- Clients can update if permitted
CREATE POLICY "Clients can update business_info if permitted" ON business_info
  FOR UPDATE TO authenticated
  USING (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_edit_business_info')
  )
  WITH CHECK (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_edit_business_info')
  );

-- ============================================
-- TEXT CONTENT POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to text_content" ON text_content
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their site's text content
CREATE POLICY "Clients can view own site text_content" ON text_content
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- Clients can update if permitted
CREATE POLICY "Clients can update text_content if permitted" ON text_content
  FOR UPDATE TO authenticated
  USING (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_edit_text')
  )
  WITH CHECK (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_edit_text')
  );

-- ============================================
-- COLLECTIONS POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to collections" ON collections
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their site's collections
CREATE POLICY "Clients can view own site collections" ON collections
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- ============================================
-- COLLECTION ITEMS POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to collection_items" ON collection_items
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their collection items
CREATE POLICY "Clients can view own collection items" ON collection_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id
      AND client_has_site_access(c.site_id)
    )
  );

-- Clients can insert if collection and site permissions allow
CREATE POLICY "Clients can insert collection items if permitted" ON collection_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      JOIN site_permissions sp ON sp.site_id = c.site_id
      WHERE c.id = collection_id
      AND client_has_site_access(c.site_id)
      AND c.can_add = true
      AND sp.can_add_collection_items = true
    )
  );

-- Clients can update their collection items
CREATE POLICY "Clients can update collection items" ON collection_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      JOIN site_permissions sp ON sp.site_id = c.site_id
      WHERE c.id = collection_id
      AND client_has_site_access(c.site_id)
      AND sp.can_edit_collections = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      JOIN site_permissions sp ON sp.site_id = c.site_id
      WHERE c.id = collection_id
      AND client_has_site_access(c.site_id)
      AND sp.can_edit_collections = true
    )
  );

-- Clients can delete if permitted
CREATE POLICY "Clients can delete collection items if permitted" ON collection_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      JOIN site_permissions sp ON sp.site_id = c.site_id
      WHERE c.id = collection_id
      AND client_has_site_access(c.site_id)
      AND c.can_delete = true
      AND sp.can_delete_collection_items = true
    )
  );

-- ============================================
-- IMAGES POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to images" ON images
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their site's images
CREATE POLICY "Clients can view own site images" ON images
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- Clients can update if permitted
CREATE POLICY "Clients can update images if permitted" ON images
  FOR UPDATE TO authenticated
  USING (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_edit_images')
  )
  WITH CHECK (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_edit_images')
  );

-- ============================================
-- SITE PERMISSIONS POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to site_permissions" ON site_permissions
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their site's permissions
CREATE POLICY "Clients can view own site permissions" ON site_permissions
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- ============================================
-- ACTIVITY LOG POLICIES
-- ============================================
-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON activity_log
  FOR SELECT TO authenticated
  USING (is_admin());

-- Admins can insert activity logs
CREATE POLICY "Admins can insert activity logs" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR client_has_site_access(site_id));

-- Clients can view their site's activity
CREATE POLICY "Clients can view own site activity" ON activity_log
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- ============================================
-- SECURITY LOGS POLICIES
-- ============================================
-- Only admins can view security logs
CREATE POLICY "Only admins can view security logs" ON security_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- Service role inserts security logs (no user policy needed)
-- Security logs are inserted via service role key

-- ============================================
-- PUBLISH HISTORY POLICIES
-- ============================================
-- Admins have full access
CREATE POLICY "Admins full access to publish_history" ON publish_history
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can view their publish history
CREATE POLICY "Clients can view own publish history" ON publish_history
  FOR SELECT TO authenticated
  USING (client_has_site_access(site_id));

-- Clients can publish if permitted
CREATE POLICY "Clients can publish if permitted" ON publish_history
  FOR INSERT TO authenticated
  WITH CHECK (
    client_has_site_access(site_id)
    AND check_site_permission(site_id, 'can_publish')
  );

-- ============================================
-- REFRESH TOKENS POLICIES
-- ============================================
-- Users can only see their own tokens
CREATE POLICY "Users can view own refresh tokens" ON refresh_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can revoke their own tokens
CREATE POLICY "Users can update own refresh tokens" ON refresh_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role handles token creation/deletion
