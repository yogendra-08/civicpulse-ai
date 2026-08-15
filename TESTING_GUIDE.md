# CivicPulse AI - End-to-End Testing Guide

## Prerequisites

Before testing, ensure:
1. Supabase project is set up with all migrations applied
2. Environment variables are configured in `.env`
3. Database has initial seed data (departments, officers if needed)
4. Application is running locally (`npm run dev`)

## Test Cases

### 1. Citizen Registration Flow

**Steps:**
1. Navigate to landing page (`/`)
2. Click "Get Started" or "Sign In"
3. Click "Register as Citizen" link
4. Fill in registration form:
   - Full Name: Test Citizen
   - Email: test.citizen@example.com
   - Password: Test@1234
   - Phone: +91 98765 43210
   - Ward: Ward 1
   - Address: 123 Test Street
5. Submit form

**Expected Results:**
- User is created in Supabase Auth
- Citizen profile is created in `citizen_profiles` table
- User is redirected to citizen dashboard
- User role is set to 'citizen'

**Verification:**
- Check Supabase Auth dashboard for new user
- Check `citizen_profiles` table for profile record
- Verify user metadata contains role='citizen'

---

### 2. Citizen Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter email: test.citizen@example.com
3. Enter password: Test@1234
4. Click "Sign In"

**Expected Results:**
- User is authenticated successfully
- Redirected to `/citizen` dashboard
- User session is stored in sessionStorage
- Audit log entry created for login action

**Verification:**
- Check `audit_logs` table for login entry
- Verify sessionStorage contains user data
- Dashboard displays citizen-specific content

---

### 3. Citizen Profile Management

**Steps:**
1. Login as citizen
2. Navigate to `/citizen/profile`
3. Update profile information:
   - Change full name
   - Update phone number
   - Add address
4. Click "Save Changes"
5. Test password change:
   - Enter current password
   - Enter new password
   - Confirm new password
6. Click "Update Password"

**Expected Results:**
- Profile updates successfully
- Changes reflect in database
- Password change requires correct current password
- Session is updated with new name

**Verification:**
- Check `citizen_profiles` table for updated data
- Verify password change works with new password
- Check audit logs for profile update actions

---

### 4. Complaint Submission Flow

**Steps:**
1. Login as citizen
2. Navigate to `/citizen/report`
3. Fill complaint form:
   - Title: Large pothole on Main Street
   - Description: There is a large pothole near the bus stop causing traffic issues
   - Location: Near Central Bus Stand
   - Ward: Ward 1
   - Upload optional image
4. Click "Submit Complaint"

**Expected Results:**
- Complaint is analyzed by AI service
- Category is detected (e.g., 'road_issue')
- Severity is assessed
- Complaint is created in database
- Complaint number is generated
- User is redirected to dashboard with success message

**Verification:**
- Check `complaints` table for new complaint
- Verify complaint_number format (CP-YYYY-XXXX)
- Check AI analysis results are stored
- Verify status is 'submitted'
- Check notification is created for department

---

### 5. Complaint Tracking Flow

**Steps:**
1. Login as citizen
2. View citizen dashboard
3. Click on a complaint to view details
4. Check complaint timeline
5. Verify status updates

**Expected Results:**
- Complaint details display correctly
- Timeline shows all status changes
- Assigned officer information is visible
- Department information is displayed

**Verification:**
- Check `complaint_timeline` table for entries
- Verify department and officer relationships
- Check status transitions are correct

---

### 6. Officer Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter officer credentials (pre-created in database)
3. Click "Sign In"

**Expected Results:**
- Officer is authenticated
- Redirected to `/officer` dashboard
- Dashboard shows assigned complaints
- Officer can view their department's complaints

**Verification:**
- Check officer profile in `officers` table
- Verify department association
- Check audit logs for login

---

### 7. Officer Complaint Management

**Steps:**
1. Login as officer
2. View assigned complaints
3. Accept a complaint assignment
4. Update complaint status
5. Add timeline notes
6. Mark complaint as resolved

**Expected Results:**
- Officer can view assigned complaints
- Status updates work correctly
- Timeline entries are created
- Notifications are sent to citizen
- Complaint is marked resolved

**Verification:**
- Check `complaints` table for status changes
- Verify `complaint_timeline` entries
- Check `notifications` table for citizen notification
- Verify resolved_at timestamp

---

### 8. Admin Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter admin credentials
3. Click "Sign In"

**Expected Results:**
- Admin is authenticated
- Redirected to `/admin` dashboard
- Admin can access all admin features

**Verification:**
- Check admin user metadata
- Verify role='admin' in user metadata
- Check audit logs

---

### 9. Admin Analytics Dashboard

**Steps:**
1. Login as admin
2. Navigate to `/admin/analytics`
3. View statistics:
   - Total complaints
   - Complaints by category
   - Complaints by status
   - Resolution times
   - Department performance

**Expected Results:**
- Analytics display correctly
- Data is fetched from database
- Charts render properly
- Statistics are accurate

**Verification:**
- Verify database queries return correct data
- Check RPC functions are working
- Verify aggregation calculations

---

### 10. Admin User Management

**Steps:**
1. Login as admin
2. Navigate to `/admin/users`
3. Filter users by role (citizen, officer, admin)
4. Search for users by name/email
5. View user details

**Expected Results:**
- User list displays correctly
- Filtering works by role
- Search functionality works
- User details are accurate

**Verification:**
- Check database queries for user listing
- Verify role-based filtering
- Test search functionality

---

### 11. Password Reset Flow

**Steps:**
1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter email address
4. Submit form

**Expected Results:**
- Password reset email is sent
- User receives reset link
- Can reset password via link

**Verification:**
- Check Supabase Auth logs
- Verify email is sent (check Supabase email logs)
- Test password reset flow end-to-end

---

### 12. Logout Flow

**Steps:**
1. Login as any user
2. Click logout button
3. Verify redirect to login page

**Expected Results:**
- User is logged out
- Session is cleared
- Redirected to login page
- Audit log entry created for logout

**Verification:**
- Check sessionStorage is cleared
- Verify `audit_logs` table for logout entry
- Check Supabase Auth session is terminated

---

### 13. Row Level Security (RLS) Testing

**Steps:**
1. Login as citizen
2. Try to access `/admin` (should fail)
3. Try to access `/officer` (should fail)
4. Login as officer
5. Try to access `/admin` (should fail)
6. Try to view other departments' complaints (should be limited)

**Expected Results:**
- Role-based access control works
- Users cannot access unauthorized routes
- Database queries respect RLS policies

**Verification:**
- Test direct API calls to verify RLS
- Check database query results are filtered
- Verify unauthorized access is blocked

---

### 14. AI Analysis Integration

**Steps:**
1. Submit a complaint with specific keywords
2. Verify AI detects correct category
3. Verify severity assessment
4. Verify department assignment

**Test Cases:**
- "Pothole" → road_issue
- "Water leak" → water_leakage
- "Garbage" → sanitation
- "Streetlight" → electrical
- "Drain" → drainage

**Expected Results:**
- AI service returns correct analysis
- Complaint is assigned to correct department
- Severity is appropriate

**Verification:**
- Check AI service responses
- Verify database category assignments
- Check department assignments

---

### 15. Notification System

**Steps:**
1. Submit a complaint as citizen
2. Login as assigned officer
3. Accept complaint
4. Check citizen receives notification
5. Update complaint status
6. Verify citizen receives status update

**Expected Results:**
- Notifications are created in database
- Real-time updates work (if implemented)
- Notification count updates

**Verification:**
- Check `notifications` table
- Verify notification types
- Check user notification preferences

---

## Database Verification Queries

### Check User Count
```sql
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM citizen_profiles;
SELECT COUNT(*) FROM officers;
```

### Check Complaint Count
```sql
SELECT COUNT(*) FROM complaints;
SELECT status, COUNT(*) FROM complaints GROUP BY status;
SELECT category, COUNT(*) FROM complaints GROUP BY category;
```

### Check Audit Logs
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### Check Notifications
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

---

## Common Issues and Troubleshooting

### Issue: Login fails with "Invalid credentials"
- **Solution:** Verify user exists in Supabase Auth
- Check email is correct
- Verify password is correct

### Issue: Complaint submission fails
- **Solution:** Check AI service is running
- Verify database connection
- Check RLS policies allow inserts

### Issue: Analytics show no data
- **Solution:** Verify database has complaints
- Check RPC functions exist
- Verify function permissions

### Issue: User management shows no users
- **Solution:** Check admin has service role permissions
- Verify database queries are correct
- Check RLS policies for admin

---

## Performance Testing

### Load Testing
- Test with 100+ concurrent users
- Measure complaint submission time
- Check dashboard load times
- Verify database query performance

### Stress Testing
- Submit 1000 complaints rapidly
- Test notification system under load
- Verify analytics queries performance

---

## Security Testing

### Authentication
- Test session expiration
- Test concurrent login attempts
- Test password strength validation

### Authorization
- Test role-based access control
- Test RLS policies
- Test API endpoint security

### Data Protection
- Verify sensitive data is encrypted
- Check audit logging for all actions
- Test SQL injection prevention

---

## Browser Compatibility

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Deployment Checklist

Before deploying to production:
- [ ] All migrations applied to production database
- [ ] Environment variables configured
- [ ] RLS policies enabled
- [ ] Admin user created
- [ ] Initial departments and officers seeded
- [ ] Email service configured (for password reset)
- [ ] AI service deployed and accessible
- [ ] CDN configured for static assets
- [ ] SSL/HTTPS enabled
- [ ] Domain configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] CORS policies configured

---

## Notes

- The TypeScript/React lint errors shown in the IDE are environment-related and do not affect functionality
- Ensure `@supabase/supabase-js` package is installed
- The application uses Vite for development and building
- All database operations use Supabase client with proper error handling
- Session management uses sessionStorage for simplicity (can be upgraded to cookies/httpOnly for production)
