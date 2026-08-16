-- Auto-create citizen profile trigger
-- This migration adds a trigger to automatically create citizen profiles on user registration

-- Function to auto-create citizen profile on user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.raw_user_meta_data->>'role' = 'citizen' THEN
        -- Insert citizen profile with RLS bypass
        BEGIN
            -- Temporarily disable RLS for this operation
            SET LOCAL session_replication_role = 'replica';

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
                phone = EXCLUDED.phone,
                ward = EXCLUDED.ward,
                address = EXCLUDED.address;
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the user registration
            RAISE LOG 'Failed to create citizen profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create citizen profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_user_meta_data->>'role' = 'citizen')
    EXECUTE FUNCTION handle_new_user();
