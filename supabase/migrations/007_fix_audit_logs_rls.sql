-- Fix audit logs RLS to allow authenticated users to insert (for triggers)
-- This fixes the 500 error when querying citizen_profiles due to audit trigger

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

SELECT 'Audit logs RLS fixed' as status;
