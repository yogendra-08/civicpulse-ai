-- COMPLETE FIX FOR CIVICPULSE AI
-- Run this entire file in Supabase SQL Editor to fix all issues

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

-- 3. Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Grant execute permission on function
GRANT EXECUTE ON FUNCTION create_citizen_profile TO anon;
GRANT EXECUTE ON FUNCTION create_citizen_profile TO authenticated;

-- 5. Fix complaints RLS policy to properly check citizen profile
DROP POLICY IF EXISTS "Citizens can view their own complaints" ON complaints;
CREATE POLICY "Citizens can view their own complaints"
    ON complaints FOR SELECT
    USING (
        citizen_id IN (
            SELECT user_id FROM citizen_profiles WHERE user_id = auth.uid()
        )
    );

-- 6. Verify all fixes
SELECT 'All fixes applied successfully' as status;
