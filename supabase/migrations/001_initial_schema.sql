-- CivicPulse AI Production Database Schema
-- This migration creates the complete database structure for the production system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');
CREATE TYPE complaint_status AS ENUM ('submitted', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE complaint_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE complaint_category AS ENUM ('road_issue', 'water_leakage', 'sanitation', 'electrical', 'drainage', 'public_sanitation');
CREATE TYPE notification_type AS ENUM ('status_update', 'assignment', 'alert', 'system');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'assign');

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    head_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    color VARCHAR(7) DEFAULT '#3b82f6',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wards table
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    population INTEGER,
    area_sq_km DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Officers table (manually created by admin)
CREATE TABLE officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    rank VARCHAR(100),
    ward VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_number)
);

-- Citizens profile table (extends auth.users)
CREATE TABLE citizen_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    ward VARCHAR(100),
    address TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Complaints table
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
    ai_confidence DECIMAL(3,2),
    ai_summary TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Complaint timeline/audit trail
CREATE TABLE complaint_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    status complaint_status NOT NULL,
    note TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    performed_by_role user_role,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citizen_profiles_updated_at BEFORE UPDATE ON citizen_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate complaint numbers (trigger function)
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_num INTEGER;
    complaint_num VARCHAR(50);
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 12) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM complaints
    WHERE complaint_number LIKE 'CP-' || year_part || '-%';
    
    complaint_num := 'CP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    NEW.complaint_number := complaint_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create citizen profile on user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_user_meta_data->>'role' = 'citizen' THEN
        INSERT INTO citizen_profiles (user_id, full_name)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Citizen')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create citizen profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_user_meta_data->>'role' = 'citizen')
    EXECUTE FUNCTION handle_new_user();

-- Trigger to auto-generate complaint number
CREATE TRIGGER generate_complaint_number_trigger
    BEFORE INSERT ON complaints
    FOR EACH ROW
    WHEN (NEW.complaint_number IS NULL)
    EXECUTE FUNCTION generate_complaint_number();

-- Insert default departments
INSERT INTO departments (name, head_name, email, phone, color, description) VALUES
('Roads & Infrastructure', 'Er. Rajesh Menon', 'roads@municipality.gov', '1800-123-4567', '#f59e0b', 'Responsible for road maintenance, pothole repairs, and infrastructure projects'),
('Water Works', 'Er. Sunita Pillai', 'water@municipality.gov', '1800-123-4568', '#3b82f6', 'Manages water supply, pipeline maintenance, and leakage repairs'),
('Sanitation & Solid Waste', 'Dr. Anil Kulkarni', 'sanitation@municipality.gov', '1800-123-4569', '#10b981', 'Handles garbage collection, street cleaning, and waste management'),
('Electrical & Street Lighting', 'Er. Meera Deshmukh', 'electrical@municipality.gov', '1800-123-4570', '#8b5cf6', 'Maintains street lights, electrical infrastructure, and power connections'),
('Drainage & Sewerage', 'Er. Vikram Naik', 'drainage@municipality.gov', '1800-123-4571', '#06b6d4', 'Manages drainage systems, sewer lines, and flood control');

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('municipality_name', 'Municipal Corporation', 'Name of the municipality'),
('complaint_auto_assign', 'true', 'Automatically assign complaints to officers'),
('notification_enabled', 'true', 'Enable notification system'),
('max_complaints_per_day', '10', 'Maximum complaints a citizen can file per day'),
('auto_escalation_hours', '48', 'Hours after which complaints are auto-escalated');

-- Create view for active complaints with officer info
CREATE VIEW active_complaints_view AS
SELECT 
    c.*,
    d.name as department_name,
    d.color as department_color,
    o.badge_number as officer_badge,
    o.user_id as officer_user_id,
    cp.full_name as citizen_name,
    cp.phone as citizen_phone
FROM complaints c
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN officers o ON c.assigned_officer_id = o.id
LEFT JOIN citizen_profiles cp ON c.citizen_id = cp.user_id
WHERE c.status != 'closed';

-- Create view for officer workload
CREATE VIEW officer_workload_view AS
SELECT 
    o.id,
    o.badge_number,
    o.user_id,
    d.name as department_name,
    d.id as department_id,
    COUNT(c.id) as total_complaints,
    COUNT(CASE WHEN c.status = 'assigned' THEN 1 END) as assigned_count,
    COUNT(CASE WHEN c.status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) as resolved_count
FROM officers o
LEFT JOIN departments d ON o.department_id = d.id
LEFT JOIN complaints c ON o.id = c.assigned_officer_id
WHERE o.is_active = true
GROUP BY o.id, o.badge_number, o.user_id, d.name, d.id;
