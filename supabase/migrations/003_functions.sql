-- Database Functions for CivicPulse AI
-- This migration creates helper functions for business logic

-- Function to assign complaint to available officer
CREATE OR REPLACE FUNCTION assign_complaint_to_officer(p_complaint_id UUID, p_department_id UUID, p_ward VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_officer_id UUID;
BEGIN
    -- Select officer with least workload from the same department and ward
    -- If no officer in same ward, select from same department
    SELECT o.id INTO v_officer_id
    FROM officers o
    WHERE o.department_id = p_department_id
    AND o.is_active = true
    AND (
        o.ward = p_ward OR
        o.ward IS NULL OR
        NOT EXISTS (
            SELECT 1 FROM officers o2 
            WHERE o2.department_id = p_department_id 
            AND o2.ward = p_ward 
            AND o2.is_active = true
        )
    )
    ORDER BY
        CASE WHEN o.ward = p_ward THEN 0 ELSE 1 END,
        (SELECT COUNT(*) FROM complaints c WHERE c.assigned_officer_id = o.id AND c.status IN ('assigned', 'in_progress')) ASC
    LIMIT 1;
    
    -- Update complaint with assigned officer
    UPDATE complaints
    SET assigned_officer_id = v_officer_id,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_complaint_id;
    
    -- Add timeline entry
    INSERT INTO complaint_timeline (complaint_id, status, note, performed_by_role)
    VALUES (
        p_complaint_id, 
        'assigned', 
        'Auto-assigned to officer by system',
        'admin'
    );
    
    RETURN v_officer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
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
$$ LANGUAGE plpgsql;

-- Function to notify citizen about status change
CREATE OR REPLACE FUNCTION notify_status_change(p_complaint_id UUID, p_new_status complaint_status)
RETURNS VOID AS $$
DECLARE
    v_citizen_id UUID;
    v_complaint_number VARCHAR;
BEGIN
    SELECT citizen_id, complaint_number INTO v_citizen_id, v_complaint_number
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
$$ LANGUAGE plpgsql;

-- Function to notify officer about new assignment
CREATE OR REPLACE FUNCTION notify_officer_assignment(p_complaint_id UUID, p_officer_id UUID)
RETURNS VOID AS $$
DECLARE
    v_complaint_number VARCHAR;
    v_complaint_title VARCHAR;
BEGIN
    SELECT complaint_number, title INTO v_complaint_number, v_complaint_title
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
$$ LANGUAGE plpgsql;

-- Function to get complaint statistics for analytics
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
        COUNT(*) as total_complaints,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_complaints,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_complaints,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned_complaints,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted_complaints,
        COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600/24), 0) as avg_resolution_time,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'resolved')::DECIMAL / COUNT(*)::DECIMAL) * 100 
            ELSE 0 
        END as resolution_rate
    FROM complaints;
END;
$$ LANGUAGE plpgsql;

-- Function to get department-wise statistics
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
        d.id as department_id,
        d.name as department_name,
        COUNT(c.id) as total_complaints,
        COUNT(c.id) FILTER (WHERE c.status = 'resolved') as resolved_complaints,
        COALESCE(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600/24) FILTER (WHERE c.status = 'resolved'), 0) as avg_resolution_time
    FROM departments d
    LEFT JOIN complaints c ON d.id = c.department_id
    GROUP BY d.id, d.name
    ORDER BY total_complaints DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get category-wise statistics
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
        category,
        COUNT(*) as count,
        CASE 
            WHEN v_total > 0 THEN (COUNT(*)::DECIMAL / v_total::DECIMAL) * 100 
            ELSE 0 
        END as percentage
    FROM complaints
    GROUP BY category
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get severity-wise statistics
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
        severity,
        COUNT(*) as count,
        CASE 
            WHEN v_total > 0 THEN (COUNT(*)::DECIMAL / v_total::DECIMAL) * 100 
            ELSE 0 
        END as percentage
    FROM complaints
    GROUP BY severity
    ORDER BY 
        CASE severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get ward-wise statistics
CREATE OR REPLACE FUNCTION get_ward_statistics(p_limit INT DEFAULT 10)
RETURNS TABLE (
    ward VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ward,
        COUNT(*) as count
    FROM complaints
    GROUP BY ward
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly trend data
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
        TO_CHAR(created_at, 'Mon') as month,
        EXTRACT(YEAR FROM created_at) as year,
        COUNT(*) as complaints,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved
    FROM complaints
    WHERE created_at >= NOW() - (p_months || ' months')::INTERVAL
    GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(YEAR FROM created_at)
    ORDER BY EXTRACT(YEAR FROM created_at), 
        CASE 
            WHEN TO_CHAR(created_at, 'Mon') = 'Jan' THEN 1
            WHEN TO_CHAR(created_at, 'Mon') = 'Feb' THEN 2
            WHEN TO_CHAR(created_at, 'Mon') = 'Mar' THEN 3
            WHEN TO_CHAR(created_at, 'Mon') = 'Apr' THEN 4
            WHEN TO_CHAR(created_at, 'Mon') = 'May' THEN 5
            WHEN TO_CHAR(created_at, 'Mon') = 'Jun' THEN 6
            WHEN TO_CHAR(created_at, 'Mon') = 'Jul' THEN 7
            WHEN TO_CHAR(created_at, 'Mon') = 'Aug' THEN 8
            WHEN TO_CHAR(created_at, 'Mon') = 'Sep' THEN 9
            WHEN TO_CHAR(created_at, 'Mon') = 'Oct' THEN 10
            WHEN TO_CHAR(created_at, 'Mon') = 'Nov' THEN 11
            WHEN TO_CHAR(created_at, 'Mon') = 'Dec' THEN 12
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to check if citizen can file complaint (rate limiting)
CREATE OR REPLACE FUNCTION can_file_complaint(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_today_count INT;
    v_max_per_day INT;
BEGIN
    -- Get max complaints per day from settings
    SELECT value::INT INTO v_max_per_day
    FROM system_settings
    WHERE key = 'max_complaints_per_day';
    
    IF v_max_per_day IS NULL THEN
        v_max_per_day := 10; -- Default limit
    END IF;
    
    -- Count complaints filed today
    SELECT COUNT(*) INTO v_today_count
    FROM complaints
    WHERE citizen_id = p_user_id
    AND DATE(created_at) = CURRENT_DATE;
    
    RETURN v_today_count < v_max_per_day;
END;
$$ LANGUAGE plpgsql;

-- Function to escalate overdue complaints
CREATE OR REPLACE FUNCTION escalate_overdue_complaints()
RETURNS INT AS $$
DECLARE
    v_escalation_hours INT;
    v_escalated_count INT := 0;
BEGIN
    -- Get escalation hours from settings
    SELECT value::INT INTO v_escalation_hours
    FROM system_settings
    WHERE key = 'auto_escalation_hours';
    
    IF v_escalation_hours IS NULL THEN
        v_escalation_hours := 48; -- Default 48 hours
    END IF;
    
    -- Find and escalate overdue complaints
    UPDATE complaints
    SET severity = 
        CASE 
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
    
    -- Log escalation
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
$$ LANGUAGE plpgsql;

-- Function to get citizen's complaint history
CREATE OR REPLACE FUNCTION get_citizen_complaint_history(p_user_id UUID, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID,
    complaint_number VARCHAR,
    title VARCHAR,
    category complaint_category,
    severity complaint_severity,
    status complaint_status,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
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
$$ LANGUAGE plpgsql;

-- Function to get officer's assigned complaints
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
    created_at TIMESTAMP WITH TIME ZONE,
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
        cp.full_name as citizen_name
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
$$ LANGUAGE plpgsql;
