-- Row Level Security Policies for CivicPulse AI
-- This migration implements security policies to ensure proper access control

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role from custom claims
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN COALESCE(
        (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
        'citizen'::user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is officer
CREATE OR REPLACE FUNCTION is_officer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'officer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get officer's department
CREATE OR REPLACE FUNCTION get_officer_department()
RETURNS UUID AS $$
DECLARE
    dept_id UUID;
BEGIN
    SELECT department_id INTO dept_id 
    FROM officers 
    WHERE user_id = auth.uid() AND is_active = true;
    RETURN dept_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DEPARTMENTS TABLE POLICIES
-- Everyone can read departments (public info)
CREATE POLICY "Departments are viewable by everyone"
    ON departments FOR SELECT
    USING (true);

-- Only admins can modify departments
CREATE POLICY "Only admins can insert departments"
    ON departments FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Only admins can update departments"
    ON departments FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete departments"
    ON departments FOR DELETE
    USING (is_admin());

-- OFFICERS TABLE POLICIES
-- Officers can view their own record
CREATE POLICY "Officers can view their own profile"
    ON officers FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all officers
CREATE POLICY "Admins can view all officers"
    ON officers FOR SELECT
    USING (is_admin());

-- Only admins can insert officers
CREATE POLICY "Only admins can insert officers"
    ON officers FOR INSERT
    WITH CHECK (is_admin());

-- Officers can update their own profile (limited fields)
CREATE POLICY "Officers can update their own profile"
    ON officers FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND 
        (phone IS NOT DISTINCT FROM OLD.phone) AND
        (is_active IS NOT DISTINCT FROM OLD.is_active)
    );

-- Admins can update all officers
CREATE POLICY "Admins can update all officers"
    ON officers FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Only admins can delete officers
CREATE POLICY "Only admins can delete officers"
    ON officers FOR DELETE
    USING (is_admin());

-- CITIZEN PROFILES TABLE POLICIES
-- Citizens can view their own profile
CREATE POLICY "Citizens can view their own profile"
    ON citizen_profiles FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all citizen profiles
CREATE POLICY "Admins can view all citizen profiles"
    ON citizen_profiles FOR SELECT
    USING (is_admin());

-- Officers can view citizen profiles for complaints assigned to them
CREATE POLICY "Officers can view citizen profiles for their complaints"
    ON citizen_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM complaints c
            WHERE c.citizen_id = citizen_profiles.user_id
            AND c.assigned_officer_id IN (
                SELECT id FROM officers WHERE user_id = auth.uid()
            )
        )
    );

-- Citizens can insert their own profile (during registration)
CREATE POLICY "Citizens can insert their own profile"
    ON citizen_profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Citizens can update their own profile
CREATE POLICY "Citizens can update their own profile"
    ON citizen_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can update all citizen profiles
CREATE POLICY "Admins can update all citizen profiles"
    ON citizen_profiles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- COMPLAINTS TABLE POLICIES
-- Citizens can view their own complaints
CREATE POLICY "Citizens can view their own complaints"
    ON complaints FOR SELECT
    USING (citizen_id = auth.uid());

-- Officers can view complaints assigned to their department
CREATE POLICY "Officers can view their department complaints"
    ON complaints FOR SELECT
    USING (
        is_officer() AND 
        department_id = get_officer_department()
    );

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints"
    ON complaints FOR SELECT
    USING (is_admin());

-- Citizens can insert complaints
CREATE POLICY "Citizens can insert complaints"
    ON complaints FOR INSERT
    WITH CHECK (citizen_id = auth.uid());

-- Only admins can update complaints (status changes handled by system)
CREATE POLICY "Admins can update complaints"
    ON complaints FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Officers can update status of complaints assigned to them
CREATE POLICY "Officers can update their assigned complaints"
    ON complaints FOR UPDATE
    USING (
        is_officer() AND 
        assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
    )
    WITH CHECK (
        is_officer() AND 
        assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
    );

-- Only admins can delete complaints
CREATE POLICY "Only admins can delete complaints"
    ON complaints FOR DELETE
    USING (is_admin());

-- COMPLAINT TIMELINE TABLE POLICIES
-- Citizens can view timeline for their own complaints
CREATE POLICY "Citizens can view their complaint timeline"
    ON complaint_timeline FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM complaints c
            WHERE c.id = complaint_timeline.complaint_id
            AND c.citizen_id = auth.uid()
        )
    );

-- Officers can view timeline for complaints assigned to them
CREATE POLICY "Officers can view timeline for their complaints"
    ON complaint_timeline FOR SELECT
    USING (
        is_officer() AND
        EXISTS (
            SELECT 1 FROM complaints c
            WHERE c.id = complaint_timeline.complaint_id
            AND c.assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
        )
    );

-- Admins can view all timeline entries
CREATE POLICY "Admins can view all timeline entries"
    ON complaint_timeline FOR SELECT
    USING (is_admin());

-- System can insert timeline entries (via service role)
CREATE POLICY "Service role can insert timeline"
    ON complaint_timeline FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Only admins can delete timeline entries
CREATE POLICY "Only admins can delete timeline entries"
    ON complaint_timeline FOR DELETE
    USING (is_admin());

-- NOTIFICATIONS TABLE POLICIES
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- AUDIT LOGS TABLE POLICIES
-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (is_admin());

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
    ON audit_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- No one can delete audit logs (immutable)
CREATE POLICY "No one can delete audit logs"
    ON audit_logs FOR DELETE
    USING (false);

-- SYSTEM SETTINGS TABLE POLICIES
-- Everyone can view system settings
CREATE POLICY "Everyone can view system settings"
    ON system_settings FOR SELECT
    USING (true);

-- Only admins can modify system settings
CREATE POLICY "Only admins can insert system settings"
    ON system_settings FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Only admins can update system settings"
    ON system_settings FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete system settings"
    ON system_settings FOR DELETE
    USING (is_admin());

-- Create trigger for automatic audit logging
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, new_values)
        VALUES (
            auth.uid(),
            get_user_role(),
            'create',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, old_values, new_values)
        VALUES (
            auth.uid(),
            get_user_role(),
            'update',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, old_values)
        VALUES (
            auth.uid(),
            get_user_role(),
            'delete',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging trigger to complaints table
CREATE TRIGGER audit_complaints_changes
    AFTER INSERT OR UPDATE OR DELETE ON complaints
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Apply audit logging trigger to officers table
CREATE TRIGGER audit_officers_changes
    AFTER INSERT OR UPDATE OR DELETE ON officers
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- Apply audit logging trigger to citizen_profiles table
CREATE TRIGGER audit_citizen_profiles_changes
    AFTER INSERT OR UPDATE ON citizen_profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
