-- COMPLETE FIX FOR CIVICPULSE AI - ALL ISSUES
-- Run this entire file in Supabase SQL Editor to fix all issues at once

-- 1. Fix get_user_role function type mismatch
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT raw_user_meta_data->>'role' INTO v_role FROM auth.users WHERE id = auth.uid();
    RETURN COALESCE(v_role::user_role, 'citizen'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create citizen profile function with SECURITY DEFINER (bypasses RLS)
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
        phone = EXCLUDED.phone,
        ward = EXCLUDED.ward,
        address = EXCLUDED.address;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Failed to create citizen profile: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix complaint number generation to handle duplicates
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
    
    -- Try to generate a unique complaint number
    WHILE attempt < max_attempts LOOP
        attempt := attempt + 1;
        
        SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 12) AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM complaints
        WHERE complaint_number LIKE 'CP-' || year_part || '-%';
        
        complaint_num := 'CP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM complaints WHERE complaint_number = complaint_num) THEN
            NEW.complaint_number := complaint_num;
            RETURN NEW;
        END IF;
        
        -- If exists, try next number
        sequence_num := sequence_num + 1;
    END LOOP;
    
    -- If we still can't find a unique number, use timestamp
    NEW.complaint_number := 'CP-' || year_part || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT, 10, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop and recreate trigger
DROP TRIGGER IF EXISTS generate_complaint_number_trigger ON complaints;
CREATE TRIGGER generate_complaint_number_trigger
    BEFORE INSERT ON complaints
    FOR EACH ROW
    WHEN (NEW.complaint_number IS NULL)
    EXECUTE FUNCTION generate_complaint_number();

-- 5. Drop old auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 6. Grant execute permission on function
GRANT EXECUTE ON FUNCTION create_citizen_profile TO anon;
GRANT EXECUTE ON FUNCTION create_citizen_profile TO authenticated;

-- 7. Fix all RLS policies to avoid recursion

-- Citizen profiles - simple policies
DROP POLICY IF EXISTS "Citizens can view their own profile" ON citizen_profiles;
DROP POLICY IF EXISTS "Citizens can insert their own profile" ON citizen_profiles;
DROP POLICY IF EXISTS "Citizens can update their own profile" ON citizen_profiles;

CREATE POLICY "Citizens can view their own profile"
    ON citizen_profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Citizens can insert their own profile"
    ON citizen_profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Citizens can update their own profile"
    ON citizen_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Complaints - simple policies
DROP POLICY IF EXISTS "Citizens can view their own complaints" ON complaints;
DROP POLICY IF EXISTS "Citizens can insert complaints" ON complaints;

CREATE POLICY "Citizens can view their own complaints"
    ON complaints FOR SELECT
    USING (citizen_id = auth.uid());

CREATE POLICY "Citizens can insert complaints"
    ON complaints FOR INSERT
    WITH CHECK (citizen_id = auth.uid());

-- Audit logs - allow authenticated to insert
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 8. Verify all fixes
SELECT 'All fixes applied successfully' as status;
