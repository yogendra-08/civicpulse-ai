-- Create citizen profile function with SECURITY DEFINER
-- This function can be called from the frontend to create citizen profiles

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
