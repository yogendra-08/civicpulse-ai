-- =============================================================================
-- Create an officer user and link to officers table
-- Run in Supabase SQL Editor AFTER creating the auth user in the dashboard
-- =============================================================================

-- STEP 1 (Dashboard): Authentication → Users → Add user
--   Email: officer@civicpulse.gov
--   Password: your choice
--   Auto Confirm User: ON
--   User Metadata:
--   {
--     "role": "officer",
--     "full_name": "Suresh Kamble"
--   }

-- STEP 2: Copy the user's UUID from Authentication → Users, paste below:
-- Replace PASTE-AUTH-USER-UUID-HERE with the actual UUID

INSERT INTO officers (user_id, badge_number, rank, department_id, ward, phone, is_active)
VALUES (
  'PASTE-AUTH-USER-UUID-HERE',
  'OFF-001',
  'Senior Officer',
  (SELECT id FROM departments WHERE name = 'Roads & Infrastructure' LIMIT 1),
  'Ward 01',
  '+91-9876543210',
  true
);

-- STEP 3: Assign existing unassigned complaints to this officer (optional)
UPDATE complaints
SET
  assigned_officer_id = (
    SELECT id FROM officers WHERE badge_number = 'OFF-001' LIMIT 1
  ),
  status = 'assigned',
  updated_at = NOW()
WHERE assigned_officer_id IS NULL;

-- STEP 4: Verify
SELECT
  o.badge_number,
  o.ward,
  d.name AS department,
  COUNT(c.id) AS assigned_complaints
FROM officers o
LEFT JOIN departments d ON d.id = o.department_id
LEFT JOIN complaints c ON c.assigned_officer_id = o.id
WHERE o.badge_number = 'OFF-001'
GROUP BY o.badge_number, o.ward, d.name;
