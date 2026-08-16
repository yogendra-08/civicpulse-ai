-- Fix get_user_role function type mismatch
-- This migration fixes the COALESCE type mismatch error in get_user_role function

-- Drop and recreate the get_user_role function with proper type casting
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT raw_user_meta_data->>'role' INTO v_role FROM auth.users WHERE id = auth.uid();
    RETURN COALESCE(v_role::user_role, 'citizen'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
