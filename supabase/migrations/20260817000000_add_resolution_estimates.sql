-- Add predicted resolution support to existing CivicPulse databases
-- Run this after the initial schema migration on projects that already exist.

ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'overdue';

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS expected_resolution_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_window VARCHAR(50);

COMMENT ON COLUMN complaints.expected_resolution_at IS
  'Predicted resolution deadline calculated from complaint category';

COMMENT ON COLUMN complaints.resolution_window IS
  'Human-readable estimated resolution window such as 3-5 days';
