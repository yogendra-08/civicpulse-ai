-- =============================================================================
-- CivicPulse AI - Complete Database Schema (single migration)
-- Run AFTER supabase/scripts/reset_database.sql on a fresh project
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');
CREATE TYPE complaint_status AS ENUM ('submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'overdue');
CREATE TYPE complaint_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE complaint_category AS ENUM ('road_issue', 'water_leakage', 'sanitation', 'electrical', 'drainage', 'public_sanitation');
CREATE TYPE notification_type AS ENUM ('status_update', 'assignment', 'alert', 'system');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'assign');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    head_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    color VARCHAR(7) DEFAULT '#3b82f6',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    population INTEGER,
    area_sq_km DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    rank VARCHAR(100),
    ward VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_number)
);

CREATE TABLE citizen_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    ward VARCHAR(100),
    address TEXT,
    date_of_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    citizen_id UUID REFERENCES citizen_profiles(user_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    ward VARCHAR(100) NOT NULL,
    category complaint_category NOT NULL,
    severity complaint_severity NOT NULL,
    status complaint_status DEFAULT 'submitted',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
    image_url TEXT,
    ai_category complaint_category,
    ai_severity complaint_severity,
    ai_confidence DECIMAL(3, 2),
    ai_summary TEXT,
    expected_resolution_at TIMESTAMPTZ,
    resolution_window VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE complaint_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    status complaint_status NOT NULL,
    note TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by_role user_role,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role user_role,
    action audit_action NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_complaints_citizen_id ON complaints(citizen_id);
CREATE INDEX idx_complaints_department_id ON complaints(department_id);
CREATE INDEX idx_complaints_officer_id ON complaints(assigned_officer_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_severity ON complaints(severity);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_ward ON complaints(ward);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_officers_department_id ON officers(department_id);
CREATE INDEX idx_officers_ward ON officers(ward);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ---------------------------------------------------------------------------
-- Core helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT raw_user_meta_data->>'role'
    INTO v_role
    FROM auth.users
    WHERE id = auth.uid();

    RETURN COALESCE(v_role::user_role, 'citizen'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_officer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'officer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_officer_department()
RETURNS UUID AS $$
DECLARE
    dept_id UUID;
BEGIN
    SELECT department_id
    INTO dept_id
    FROM officers
    WHERE user_id = auth.uid() AND is_active = true;

    RETURN dept_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_num INTEGER;
    complaint_num VARCHAR(50);
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    WHILE attempt < max_attempts LOOP
        attempt := attempt + 1;

        SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 12) AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM complaints
        WHERE complaint_number LIKE 'CP-' || year_part || '-%';

        complaint_num := 'CP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');

        IF NOT EXISTS (SELECT 1 FROM complaints WHERE complaint_number = complaint_num) THEN
            NEW.complaint_number := complaint_num;
            RETURN NEW;
        END IF;

        sequence_num := sequence_num + 1;
    END LOOP;

    NEW.complaint_number := 'CP-' || year_part || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT, 10, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_user_meta_data->>'role' = 'citizen' THEN
        INSERT INTO citizen_profiles (user_id, full_name, phone, ward, address)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Citizen'),
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'ward',
            NEW.raw_user_meta_data->>'address'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = COALESCE(EXCLUDED.phone, citizen_profiles.phone),
            ward = COALESCE(EXCLUDED.ward, citizen_profiles.ward),
            address = COALESCE(EXCLUDED.address, citizen_profiles.address);
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Failed to create citizen profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION create_citizen_profile(
    p_user_id UUID,
    p_full_name VARCHAR,
    p_phone VARCHAR DEFAULT NULL,
    p_ward VARCHAR DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO citizen_profiles (user_id, full_name, phone, ward, address)
    VALUES (p_user_id, p_full_name, p_phone, p_ward, p_address)
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, citizen_profiles.phone),
        ward = COALESCE(EXCLUDED.ward, citizen_profiles.ward),
        address = COALESCE(EXCLUDED.address, citizen_profiles.address);

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Failed to create citizen profile: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, new_values)
        VALUES (auth.uid(), get_user_role(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), get_user_role(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, old_values)
        VALUES (auth.uid(), get_user_role(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Business logic functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_complaint_to_officer(p_complaint_id UUID, p_department_id UUID, p_ward VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_officer_id UUID;
BEGIN
    SELECT o.id
    INTO v_officer_id
    FROM officers o
    WHERE o.department_id = p_department_id
      AND o.is_active = true
      AND (
          o.ward = p_ward OR
          o.ward IS NULL OR
          NOT EXISTS (
              SELECT 1
              FROM officers o2
              WHERE o2.department_id = p_department_id
                AND o2.ward = p_ward
                AND o2.is_active = true
          )
      )
    ORDER BY
        CASE WHEN o.ward = p_ward THEN 0 ELSE 1 END,
        (SELECT COUNT(*) FROM complaints c WHERE c.assigned_officer_id = o.id AND c.status IN ('assigned', 'in_progress')) ASC
    LIMIT 1;

    UPDATE complaints
    SET assigned_officer_id = v_officer_id,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_complaint_id;

    INSERT INTO complaint_timeline (complaint_id, status, note, performed_by_role)
    VALUES (p_complaint_id, 'assigned', 'Auto-assigned to officer by system', 'admin');

    RETURN v_officer_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title VARCHAR,
    p_body TEXT,
    p_complaint_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, body, complaint_id)
    VALUES (p_user_id, p_type, p_title, p_body, p_complaint_id)
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION notify_status_change(p_complaint_id UUID, p_new_status complaint_status)
RETURNS VOID AS $$
DECLARE
    v_citizen_id UUID;
    v_complaint_number VARCHAR;
BEGIN
    SELECT citizen_id, complaint_number
    INTO v_citizen_id, v_complaint_number
    FROM complaints
    WHERE id = p_complaint_id;

    IF v_citizen_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, complaint_id)
        VALUES (
            v_citizen_id,
            'status_update',
            'Complaint Status Updated',
            'Your complaint ' || v_complaint_number || ' status has been updated to ' || p_new_status,
            p_complaint_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION notify_officer_assignment(p_complaint_id UUID, p_officer_id UUID)
RETURNS VOID AS $$
DECLARE
    v_complaint_number VARCHAR;
    v_complaint_title VARCHAR;
BEGIN
    SELECT complaint_number, title
    INTO v_complaint_number, v_complaint_title
    FROM complaints
    WHERE id = p_complaint_id;

    INSERT INTO notifications (user_id, type, title, body, complaint_id)
    VALUES (
        (SELECT user_id FROM officers WHERE id = p_officer_id),
        'assignment',
        'New Complaint Assigned',
        'Complaint ' || v_complaint_number || ': ' || v_complaint_title || ' has been assigned to you',
        p_complaint_id
    );
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_complaint_statistics()
RETURNS TABLE (
    total_complaints BIGINT,
    resolved_complaints BIGINT,
    in_progress_complaints BIGINT,
    assigned_complaints BIGINT,
    submitted_complaints BIGINT,
    avg_resolution_time DECIMAL,
    resolution_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS total_complaints,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_complaints,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_complaints,
        COUNT(*) FILTER (WHERE status = 'assigned') AS assigned_complaints,
        COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_complaints,
        COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 / 24), 0) AS avg_resolution_time,
        CASE
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'resolved')::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0
        END AS resolution_rate
    FROM complaints;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_department_statistics()
RETURNS TABLE (
    department_id UUID,
    department_name VARCHAR,
    total_complaints BIGINT,
    resolved_complaints BIGINT,
    avg_resolution_time DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id AS department_id,
        d.name AS department_name,
        COUNT(c.id) AS total_complaints,
        COUNT(c.id) FILTER (WHERE c.status = 'resolved') AS resolved_complaints,
        COALESCE(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600 / 24) FILTER (WHERE c.status = 'resolved'), 0) AS avg_resolution_time
    FROM departments d
    LEFT JOIN complaints c ON d.id = c.department_id
    GROUP BY d.id, d.name
    ORDER BY total_complaints DESC;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_category_statistics()
RETURNS TABLE (
    category complaint_category,
    count BIGINT,
    percentage DECIMAL
) AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM complaints;

    RETURN QUERY
    SELECT
        c.category,
        COUNT(*) AS count,
        CASE
            WHEN v_total > 0 THEN (COUNT(*)::DECIMAL / v_total::DECIMAL) * 100
            ELSE 0
        END AS percentage
    FROM complaints c
    GROUP BY c.category
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_severity_statistics()
RETURNS TABLE (
    severity complaint_severity,
    count BIGINT,
    percentage DECIMAL
) AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM complaints;

    RETURN QUERY
    SELECT
        c.severity,
        COUNT(*) AS count,
        CASE
            WHEN v_total > 0 THEN (COUNT(*)::DECIMAL / v_total::DECIMAL) * 100
            ELSE 0
        END AS percentage
    FROM complaints c
    GROUP BY c.severity
    ORDER BY
        CASE c.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_ward_statistics(p_limit INT DEFAULT 10)
RETURNS TABLE (
    ward VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.ward,
        COUNT(*) AS count
    FROM complaints c
    GROUP BY c.ward
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_monthly_trend(p_months INT DEFAULT 6)
RETURNS TABLE (
    month VARCHAR,
    year INT,
    complaints BIGINT,
    resolved BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(c.created_at, 'Mon') AS month,
        EXTRACT(YEAR FROM c.created_at)::INT AS year,
        COUNT(*) AS complaints,
        COUNT(*) FILTER (WHERE c.status = 'resolved') AS resolved
    FROM complaints c
    WHERE c.created_at >= NOW() - (p_months || ' months')::INTERVAL
    GROUP BY TO_CHAR(c.created_at, 'Mon'), EXTRACT(YEAR FROM c.created_at)
    ORDER BY EXTRACT(YEAR FROM c.created_at),
        CASE TO_CHAR(c.created_at, 'Mon')
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3 WHEN 'Apr' THEN 4
            WHEN 'May' THEN 5 WHEN 'Jun' THEN 6 WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8
            WHEN 'Sep' THEN 9 WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION can_file_complaint(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_today_count INT;
    v_max_per_day INT;
BEGIN
    SELECT value::INT
    INTO v_max_per_day
    FROM system_settings
    WHERE key = 'max_complaints_per_day';

    IF v_max_per_day IS NULL THEN
        v_max_per_day := 10;
    END IF;

    SELECT COUNT(*)
    INTO v_today_count
    FROM complaints
    WHERE citizen_id = p_user_id
      AND DATE(created_at) = CURRENT_DATE;

    RETURN v_today_count < v_max_per_day;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION escalate_overdue_complaints()
RETURNS INT AS $$
DECLARE
    v_escalation_hours INT;
    v_escalated_count INT := 0;
BEGIN
    SELECT value::INT
    INTO v_escalation_hours
    FROM system_settings
    WHERE key = 'auto_escalation_hours';

    IF v_escalation_hours IS NULL THEN
        v_escalation_hours := 48;
    END IF;

    UPDATE complaints
    SET severity = CASE
            WHEN severity = 'low' THEN 'medium'
            WHEN severity = 'medium' THEN 'high'
            WHEN severity = 'high' THEN 'critical'
            ELSE severity
        END,
        updated_at = NOW()
    WHERE status IN ('assigned', 'in_progress')
      AND updated_at < NOW() - (v_escalation_hours || ' hours')::INTERVAL
      AND created_at > NOW() - (v_escalation_hours * 2 || ' hours')::INTERVAL;

    GET DIAGNOSTICS v_escalated_count = ROW_COUNT;

    IF v_escalated_count > 0 THEN
        INSERT INTO audit_logs (user_id, user_role, action, table_name, new_values)
        VALUES (
            NULL,
            'admin',
            'update',
            'complaints',
            jsonb_build_object('escalated_count', v_escalated_count, 'reason', 'auto_escalation')
        );
    END IF;

    RETURN v_escalated_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_citizen_complaint_history(p_user_id UUID, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID,
    complaint_number VARCHAR,
    title VARCHAR,
    category complaint_category,
    severity complaint_severity,
    status complaint_status,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.complaint_number,
        c.title,
        c.category,
        c.severity,
        c.status,
        c.created_at,
        c.updated_at
    FROM complaints c
    WHERE c.citizen_id = p_user_id
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION get_officer_complaints(p_officer_id UUID, p_status complaint_status DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    complaint_number VARCHAR,
    title VARCHAR,
    category complaint_category,
    severity complaint_severity,
    status complaint_status,
    location TEXT,
    ward VARCHAR,
    created_at TIMESTAMPTZ,
    citizen_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.complaint_number,
        c.title,
        c.category,
        c.severity,
        c.status,
        c.location,
        c.ward,
        c.created_at,
        cp.full_name AS citizen_name
    FROM complaints c
    LEFT JOIN citizen_profiles cp ON c.citizen_id = cp.user_id
    WHERE c.assigned_officer_id = p_officer_id
      AND (p_status IS NULL OR c.status = p_status)
    ORDER BY
        CASE c.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        c.created_at DESC;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_officers_updated_at
    BEFORE UPDATE ON officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citizen_profiles_updated_at
    BEFORE UPDATE ON citizen_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_complaint_number_trigger
    BEFORE INSERT ON complaints
    FOR EACH ROW
    WHEN (NEW.complaint_number IS NULL)
    EXECUTE FUNCTION generate_complaint_number();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_user_meta_data->>'role' = 'citizen')
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER audit_complaints_changes
    AFTER INSERT OR UPDATE OR DELETE ON complaints
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_officers_changes
    AFTER INSERT OR UPDATE OR DELETE ON officers
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_citizen_profiles_changes
    AFTER INSERT OR UPDATE ON citizen_profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
CREATE VIEW active_complaints_view AS
SELECT
    c.*,
    d.name AS department_name,
    d.color AS department_color,
    o.badge_number AS officer_badge,
    o.user_id AS officer_user_id,
    cp.full_name AS citizen_name,
    cp.phone AS citizen_phone
FROM complaints c
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN officers o ON c.assigned_officer_id = o.id
LEFT JOIN citizen_profiles cp ON c.citizen_id = cp.user_id
WHERE c.status != 'closed';

CREATE VIEW officer_workload_view AS
SELECT
    o.id,
    o.badge_number,
    o.user_id,
    d.name AS department_name,
    d.id AS department_id,
    COUNT(c.id) AS total_complaints,
    COUNT(c.id) FILTER (WHERE c.status = 'assigned') AS assigned_count,
    COUNT(c.id) FILTER (WHERE c.status = 'in_progress') AS in_progress_count,
    COUNT(c.id) FILTER (WHERE c.status = 'resolved') AS resolved_count
FROM officers o
LEFT JOIN departments d ON o.department_id = d.id
LEFT JOIN complaints c ON o.id = c.assigned_officer_id
WHERE o.is_active = true
GROUP BY o.id, o.badge_number, o.user_id, d.name, d.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments are viewable by everyone"
    ON departments FOR SELECT USING (true);

CREATE POLICY "Only admins can insert departments"
    ON departments FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update departments"
    ON departments FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete departments"
    ON departments FOR DELETE USING (is_admin());

CREATE POLICY "Officers can view their own profile"
    ON officers FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all officers"
    ON officers FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can insert officers"
    ON officers FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Officers can update their own profile"
    ON officers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all officers"
    ON officers FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete officers"
    ON officers FOR DELETE USING (is_admin());

CREATE POLICY "Citizens can view their own profile"
    ON citizen_profiles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all citizen profiles"
    ON citizen_profiles FOR SELECT USING (is_admin());

CREATE POLICY "Officers can view citizen profiles for their complaints"
    ON citizen_profiles FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM complaints c
            WHERE c.citizen_id = citizen_profiles.user_id
              AND c.assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Citizens can insert their own profile"
    ON citizen_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Citizens can update their own profile"
    ON citizen_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all citizen profiles"
    ON citizen_profiles FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Citizens can view their own complaints"
    ON complaints FOR SELECT USING (citizen_id = auth.uid());

CREATE POLICY "Officers can view their department complaints"
    ON complaints FOR SELECT USING (is_officer() AND department_id = get_officer_department());

CREATE POLICY "Admins can view all complaints"
    ON complaints FOR SELECT USING (is_admin());

CREATE POLICY "Citizens can insert complaints"
    ON complaints FOR INSERT WITH CHECK (citizen_id = auth.uid());

CREATE POLICY "Admins can update complaints"
    ON complaints FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Officers can update their assigned complaints"
    ON complaints FOR UPDATE
    USING (is_officer() AND assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()))
    WITH CHECK (is_officer() AND assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

CREATE POLICY "Only admins can delete complaints"
    ON complaints FOR DELETE USING (is_admin());

CREATE POLICY "Citizens can view their complaint timeline"
    ON complaint_timeline FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM complaints c
            WHERE c.id = complaint_timeline.complaint_id AND c.citizen_id = auth.uid()
        )
    );

CREATE POLICY "Officers can view timeline for their complaints"
    ON complaint_timeline FOR SELECT USING (
        is_officer() AND EXISTS (
            SELECT 1 FROM complaints c
            WHERE c.id = complaint_timeline.complaint_id
              AND c.assigned_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all timeline entries"
    ON complaint_timeline FOR SELECT USING (is_admin());

CREATE POLICY "Service role can insert timeline"
    ON complaint_timeline FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Only admins can delete timeline entries"
    ON complaint_timeline FOR DELETE USING (is_admin());

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT USING (is_admin());

CREATE POLICY "Service role can insert audit logs"
    ON audit_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Authenticated can insert audit logs"
    ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "No one can delete audit logs"
    ON audit_logs FOR DELETE USING (false);

CREATE POLICY "Everyone can view system settings"
    ON system_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can insert system settings"
    ON system_settings FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update system settings"
    ON system_settings FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete system settings"
    ON system_settings FOR DELETE USING (is_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION create_citizen_profile TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------
INSERT INTO departments (name, head_name, email, phone, color, description) VALUES
('Roads & Infrastructure', 'Er. Rajesh Menon', 'roads@municipality.gov', '1800-123-4567', '#f59e0b', 'Responsible for road maintenance, pothole repairs, and infrastructure projects'),
('Water Works', 'Er. Sunita Pillai', 'water@municipality.gov', '1800-123-4568', '#3b82f6', 'Manages water supply, pipeline maintenance, and leakage repairs'),
('Sanitation & Solid Waste', 'Dr. Anil Kulkarni', 'sanitation@municipality.gov', '1800-123-4569', '#10b981', 'Handles garbage collection, street cleaning, and waste management'),
('Electrical & Street Lighting', 'Er. Meera Deshmukh', 'electrical@municipality.gov', '1800-123-4570', '#8b5cf6', 'Maintains street lights, electrical infrastructure, and power connections'),
('Drainage & Sewerage', 'Er. Vikram Naik', 'drainage@municipality.gov', '1800-123-4571', '#06b6d4', 'Manages drainage systems, sewer lines, and flood control');

INSERT INTO system_settings (key, value, description) VALUES
('municipality_name', 'Municipal Corporation', 'Name of the municipality'),
('complaint_auto_assign', 'true', 'Automatically assign complaints to officers'),
('notification_enabled', 'true', 'Enable notification system'),
('max_complaints_per_day', '10', 'Maximum complaints a citizen can file per day'),
('auto_escalation_hours', '48', 'Hours after which complaints are auto-escalated');
