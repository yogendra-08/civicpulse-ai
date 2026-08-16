-- =============================================================================
-- CivicPulse AI - COMPLETE DATABASE RESET
-- Run this in Supabase Dashboard → SQL Editor BEFORE applying the new migration
-- WARNING: This deletes ALL CivicPulse tables, functions, types, and data.
-- =============================================================================

-- 1. Remove auth trigger (lives outside public schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Nuclear reset of public schema (fastest clean slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 3. Restore Supabase default grants on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 4. Clear Supabase CLI migration history (only if you use `supabase db push`)
-- Safe to skip: this schema does NOT exist when you only use SQL Editor manually
DO $$
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    TRUNCATE supabase_migrations.schema_migrations;
    RAISE NOTICE 'Cleared supabase_migrations.schema_migrations';
  ELSE
    RAISE NOTICE 'No supabase_migrations schema found (normal for SQL Editor setup) — skipped';
  END IF;
END $$;

-- 5. OPTIONAL: Delete all auth users (uncomment if you want a full zero start)
-- DELETE FROM auth.users;

SELECT 'Database reset complete. Now run: supabase/migrations/20250816000000_initial_schema.sql' AS status;
