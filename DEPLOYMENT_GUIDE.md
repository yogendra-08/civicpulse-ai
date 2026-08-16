# CivicPulse AI - Deployment Guide

This guide provides detailed step-by-step instructions for deploying CivicPulse AI to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Configuration](#environment-configuration)
5. [Initial Data Seeding](#initial-data-seeding)
6. [Application Build](#application-build)
7. [Deployment Platform Setup](#deployment-platform-setup)
8. [Post-Deployment Configuration](#post-deployment-configuration)
9. [Verification Steps](#verification-steps)

---

## Prerequisites

### Required Accounts & Services
- [Supabase Account](https://supabase.com) (Free tier or paid)
- [GitHub Account](https://github.com) (for code hosting and CI/CD)
- [Vercel Account](https://vercel.com) or [Netlify Account](https://netlify.com) (for frontend hosting)
- Domain name (optional, for custom URL)

### Required Software (Local Development)
- Node.js (v18 or higher)
- npm or yarn package manager
- Git
- Code editor (VS Code recommended)

### Required Tools
- Supabase CLI (optional, for local development)
- PostgreSQL client (optional, for direct database access)

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: `civicpulse-ai` (or your preferred name)
   - **Database Password**: Generate a strong password (save this securely)
   - **Region**: Choose region closest to your target users
   - **Pricing Plan**: Free tier for testing, Pro for production
5. Click **"Create new project"**
6. Wait for project to be provisioned (2-3 minutes)

### Step 2: Get Supabase Credentials

1. Navigate to your project dashboard
2. Go to **Settings** → **API**
3. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role** key (keep secret, never expose to client)

**⚠️ IMPORTANT**: Save these credentials securely. You'll need them for environment configuration.

### Step 3: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure email settings:
   - **Email Templates**: Customize verification and reset password emails
   - **SMTP Settings**: For production, configure your own SMTP server
   - **Confirm email**: Disable for faster registration (optional for MVP)

### Step 4: Configure Database

1. Go to **SQL Editor** in Supabase dashboard
2. Open the migration files from your project:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions.sql`
3. Execute each migration file in order (001, then 002, then 003)
4. Verify tables are created in **Table Editor**

---

## Database Configuration

### Step 5: Create Initial Departments

1. Go to **Table Editor** → **departments**
2. Click **Insert row** and add departments:

```sql
INSERT INTO departments (name, description, contact_email, contact_phone) VALUES
('Roads & Infrastructure', 'Manages road maintenance, potholes, and infrastructure', 'roads@municipality.gov', '+91-1234567890'),
('Water Supply', 'Handles water supply, leaks, and drainage issues', 'water@municipality.gov', '+91-1234567891'),
('Sanitation', 'Manages garbage collection and sanitation services', 'sanitation@municipality.gov', '+91-1234567892'),
('Electrical', 'Maintains streetlights and electrical infrastructure', 'electrical@municipality.gov', '+91-1234567893'),
('Health & Safety', 'Handles public health and safety concerns', 'health@municipality.gov', '+91-1234567894');
```

### Step 6: Create Initial Officers

1. Go to **Table Editor** → **officers**
2. Insert sample officers (you'll need to create auth users first):

```sql
-- First, create auth users for officers via Supabase Auth dashboard
-- Then insert officer profiles linking to those user IDs

INSERT INTO officers (user_id, badge_number, rank, department_id, ward, phone) VALUES
-- Replace user_id with actual auth user IDs from Supabase Auth
('uuid-from-auth', 'OFF-001', 'Senior Officer', 1, 'Ward 1', '+91-9876543210'),
('uuid-from-auth', 'OFF-002', 'Officer', 2, 'Ward 2', '+91-9876543211');
```

### Step 7: Create Admin User

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Enter admin details:
   - **Email**: admin@civicpulse.gov (or your preferred admin email)
   - **Password**: Strong password
   - **Auto-confirm user**: Yes
4. After creation, click on the user to edit
5. In **User Metadata**, add:
   ```json
   {
     "role": "admin",
     "full_name": "System Administrator"
   }
   ```
6. Click **Save**

---

## Environment Configuration

### Step 8: Create Environment File

1. In your project root, create a file named `.env`
2. Copy the contents from `.env.example`
3. Fill in the actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Environment
VITE_ENV=production

# Application Configuration
VITE_APP_NAME=CivicPulse AI
VITE_MUNICIPALITY_NAME=Springfield
```

### Step 9: Verify Environment Variables

1. Ensure `.env` file is in project root
2. Ensure `.env` is added to `.gitignore` (already should be)
3. Test that variables load correctly:
   ```bash
   # In development
   npm run dev
   ```
4. Check browser console for any environment variable errors

---

## Initial Data Seeding

### Step 10: Seed Wards Data

1. Go to **SQL Editor** in Supabase
2. Execute:

```sql
INSERT INTO wards (name, description, population) VALUES
('Ward 1', 'Central Business District', 50000),
('Ward 2', 'Residential Area North', 45000),
('Ward 3', 'Residential Area South', 42000),
('Ward 4', 'Industrial Zone', 30000),
('Ward 5', 'Educational Hub', 35000);
```

### Step 11: Test Database Connections

1. Run the application locally:
   ```bash
   npm install
   npm run dev
   ```
2. Navigate to `http://localhost:5173`
3. Try to register a new citizen
4. Verify data appears in Supabase tables:
   - `auth.users`
   - `citizen_profiles`
5. Check audit logs in `audit_logs` table

---

## Application Build

### Step 12: Install Dependencies

1. Open terminal in project directory
2. Run:
   ```bash
   npm install
   ```
3. Verify no errors occur

### Step 13: Build for Production

1. Run production build:
   ```bash
   npm run build
   ```
2. Verify build succeeds (creates `dist/` folder)
3. Test production build locally:
   ```bash
   npm run preview
   ```
4. Navigate to `http://localhost:4173`
5. Test all major flows:
   - Registration
   - Login
   - Complaint submission
   - Dashboard access

### Step 14: Fix Build Errors (if any)

If build fails:
1. Check TypeScript errors:
   ```bash
   npm run type-check
   ```
2. Check linting errors:
   ```bash
   npm run lint
   ```
3. Fix any errors before proceeding

---

## Deployment Platform Setup

### Option A: Deploy to Vercel (Recommended)

#### Step 15A: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in
3. Click **"Add New Project"**
4. Import your GitHub repository (or upload manually)

#### Step 16A: Configure Vercel Project

1. **Framework Preset**: Vite
2. **Root Directory**: `./` (or leave empty)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

#### Step 17A: Add Environment Variables in Vercel

1. In Vercel project settings, go to **Environment Variables**
2. Add each variable from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ENV=production`
   - `VITE_APP_NAME`
   - `VITE_MUNICIPALITY_NAME`
3. Select **Production**, **Preview**, and **Development** environments
4. Click **Save**

#### Step 18A: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Vercel will provide a URL: `https://your-project.vercel.app`

#### Step 19A: Configure Custom Domain (Optional)

1. In Vercel project, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `civicpulse.gov`)
4. Update DNS records as instructed by Vercel
5. Wait for SSL certificate to provision

---

### Option B: Deploy to Netlify

#### Step 15B: Connect to Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Sign up or log in
3. Click **"Add new site"** → **"Import an existing project"**

#### Step 16B: Configure Netlify

1. Connect your GitHub repository
2. **Build command**: `npm run build`
3. **Publish directory**: `dist`
4. Click **"Deploy site"**

#### Step 17B: Add Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Add all variables from `.env` file
3. Redeploy after adding variables

---

## Post-Deployment Configuration

### Step 20: Configure Email Service (Production)

For production email delivery:

1. Go to Supabase **Settings** → **Authentication** → **Email Templates**
2. Configure SMTP settings:
   - **SMTP Host**: Your SMTP server (e.g., smtp.gmail.com)
   - **SMTP Port**: 587 (TLS)
   - **SMTP User**: Your email
   - **SMTP Password**: Your email password or app-specific password
3. Test email delivery by triggering a password reset

### Step 21: Set Up Monitoring

1. **Supabase Monitoring**:
   - Enable database logs
   - Set up alerts for high error rates
   - Monitor storage usage

2. **Application Monitoring**:
   - Consider integrating Sentry for error tracking
   - Set up Google Analytics or similar
   - Monitor Vercel/Netlify analytics

### Step 22: Configure CORS (if needed)

If you have separate backend services:

1. Go to Supabase **Settings** → **API**
2. Add your frontend domain to **CORS allowed origins**
3. Example: `https://civicpulse.gov`

### Step 23: Enable Row Level Security

Verify RLS is enabled:

1. Go to **SQL Editor** in Supabase
2. Run:
   ```sql
   -- Check RLS status
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
3. Ensure all tables have `rowsecurity = true`

---

## Verification Steps

### Step 24: Test All User Flows

After deployment, test these flows:

#### Citizen Flow
1. [ ] Navigate to landing page
2. [ ] Register as new citizen
3. [ ] Verify email (if enabled)
4. [ ] Login as citizen
5. [ ] Submit a complaint
6. [ ] View complaint in dashboard
7. [ ] Update profile
8. [ ] Logout

#### Officer Flow
1. [ ] Login as officer
2. [ ] View assigned complaints
3. [ ] Accept a complaint
4. [ ] Update complaint status
5. [ ] Add timeline notes
6. [ ] Mark complaint as resolved

#### Admin Flow
1. [ ] Login as admin
2. [ ] View analytics dashboard
3. [ ] Access user management
4. [ ] Filter users by role
5. [ ] Search for users
6. [ ] View system statistics

### Step 25: Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- Check user counts
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM citizen_profiles) as citizens,
  (SELECT COUNT(*) FROM officers) as officers;

-- Check complaint counts
SELECT 
  (SELECT COUNT(*) FROM complaints) as total_complaints,
  (SELECT COUNT(*) FROM complaints WHERE status = 'submitted') as submitted,
  (SELECT COUNT(*) FROM complaints WHERE status = 'resolved') as resolved;

-- Check recent audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### Step 26: Security Verification

1. [ ] Test unauthorized access (try accessing `/admin` as citizen)
2. [ ] Test SQL injection attempts (should be blocked by RLS)
3. [ ] Verify passwords are hashed (check Supabase Auth)
4. [ ] Test session expiration
5. [ ] Verify HTTPS is enabled

### Step 27: Performance Verification

1. [ ] Test page load times (should be < 3 seconds)
2. [ ] Test complaint submission speed
3. [ ] Test dashboard loading with many complaints
4. [ ] Check mobile responsiveness

---

## Maintenance Tasks

### Regular Maintenance

**Weekly:**
- Check Supabase storage usage
- Review audit logs for suspicious activity
- Monitor error rates

**Monthly:**
- Review and optimize database queries
- Check for software updates
- Backup database (Supabase does this automatically)

**Quarterly:**
- Review user feedback
- Update documentation
- Security audit

### Backup Strategy

Supabase provides automatic backups:
- **Point-in-time recovery**: Up to 7 days (free tier)
- **Physical backups**: Daily (Pro tier)
- Consider exporting data regularly for additional safety

---

## Troubleshooting

### Issue: Login fails after deployment

**Solution:**
1. Verify environment variables are set correctly
2. Check Supabase project URL and anon key
3. Ensure RLS policies allow authentication
4. Check browser console for errors

### Issue: Complaint submission fails

**Solution:**
1. Verify AI service is accessible
2. Check database connection
3. Verify RLS policies allow inserts
4. Check Supabase logs for errors

### Issue: Analytics show no data

**Solution:**
1. Verify database has complaints
2. Check RPC functions exist
3. Verify function permissions
4. Check browser console for API errors

### Issue: Email not sending

**Solution:**
1. Verify SMTP configuration
2. Check email templates are configured
3. Verify email provider allows sending
4. Check Supabase email logs

---

## Rollback Plan

If deployment fails:

1. **Vercel**: Automatic rollback to previous deployment
2. **Netlify**: Deploy previous commit
3. **Database**: Use Supabase point-in-time recovery
4. **Environment**: Revert `.env` to previous values

---

## Contact & Support

- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
- **Netlify Support**: https://netlify.com/support

---

## Next Steps After Deployment

1. **User Training**: Create user guides for citizens, officers, and admins
2. **Marketing**: Promote the platform to citizens
3. **Feedback Collection**: Set up feedback mechanisms
4. **Iterate**: Continuously improve based on usage data
5. **Scale**: Upgrade plans as user base grows

---

## Checklist Summary

- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Initial departments created
- [ ] Initial officers created
- [ ] Admin user created
- [ ] Environment variables configured
- [ ] Application built successfully
- [ ] Deployed to hosting platform
- [ ] Custom domain configured (optional)
- [ ] Email service configured
- [ ] Monitoring set up
- [ ] All user flows tested
- [ ] Security verified
- [ ] Performance verified
- [ ] Backup strategy confirmed

---

**Last Updated**: August 2026
**Version**: 1.0.0
