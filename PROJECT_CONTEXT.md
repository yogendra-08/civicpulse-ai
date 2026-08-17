# CivicPulse AI Project Context

## Snapshot

CivicPulse AI is a Vite + React + TypeScript civic grievance platform backed by Supabase. It supports three roles:

- Citizen: registers/logs in, reports complaints, tracks complaint status.
- Officer: views assigned complaints, advances status, adds notes.
- Admin: views all complaints, analytics, and user-management screens.

The app now also includes a global floating chat assistant on every page. It uses Gemini when configured and falls back to reserved civic-portal answers when Gemini is unavailable.

## Stack

- React 18, TypeScript, Vite
- React Router DOM 7
- TailwindCSS with custom utility classes in `src/index.css`
- Lucide React icons
- Recharts for admin analytics
- Supabase Auth and PostgreSQL

Useful scripts:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

Recent verification:

- `npm run build` passes
- `npm run typecheck` passes

## Important Files

- `src/App.tsx`: route tree and role-gated pages.
- `src/context/AuthContext.tsx`: app-level auth state using `realAuthService`.
- `src/services/realAuthService.ts`: Supabase auth, session storage, profile loading/updating.
- `src/services/realComplaintService.ts`: Supabase complaint CRUD, mapping DB rows to app types, analytics RPC calls.
- `src/services/aiService.ts`: local keyword-based AI classifier for category, severity, department, and officer selection.
- `src/types/index.ts`: core domain types.
- `src/components/DashboardLayout.tsx`: shared role dashboards shell.
- `src/components/ComplaintComponents.tsx`: complaint cards and details modal.
- `src/components/ChatAgent.tsx`: floating Gemini-powered assistant with local fallback answers.
- `supabase/migrations/20250816000000_initial_schema.sql`: database schema, RLS policies, RPCs, triggers, seed departments/settings.

## Frontend Routes

- `/`: landing page
- `/login`: login
- `/register`: citizen registration
- `/citizen`: citizen dashboard
- `/citizen/report`: report complaint
- `/citizen/profile`: citizen profile
- `/officer`: officer dashboard
- `/admin`: admin dashboard
- `/admin/analytics`: admin analytics
- `/admin/users`: user management

The chat assistant is mounted from `src/App.tsx`, so it appears on all routes.

Role access is enforced by `RequireRole`, which redirects unauthenticated users to `/login` and users with the wrong role to their role dashboard.

## Data Model

Main Supabase tables:

- `departments`
- `wards`
- `officers`
- `citizen_profiles`
- `complaints`
- `complaint_timeline`
- `notifications`
- `audit_logs`
- `system_settings`

Key enums include user roles, complaint statuses, severity levels, categories, notification types, and audit actions.

## Current Architecture Notes

- The app has old mock services (`authService.ts`, `complaintService.ts`, `mockData.ts`) and current Supabase services (`realAuthService.ts`, `realComplaintService.ts`). Most pages now use the real services, but some UI metadata/notifications still come from mock data.
- `aiService` is deterministic keyword logic with a simulated delay, not an external AI API.
- Complaint creation does a client-side AI analysis, inserts into Supabase, optionally auto-assigns through RPC, creates timeline, and notifies officers.
- Admin analytics combines direct complaint queries with Supabase RPC statistics.
- The chat assistant reads `VITE_GEMINI_API_KEY` and optional `VITE_GEMINI_MODEL` from environment variables.
- Reserved fallback answers cover login, complaint filing, dashboards, profile, support, and common troubleshooting questions.

## Known Risks / Follow-Up Areas

- `realAuthService.registerCitizen` and `UserManagementPage` call Supabase Admin APIs from frontend code. Those generally require service-role privileges and should be moved server-side or replaced with safer RPCs.
- `realAuthService.ts` creates its own Supabase client instead of reusing `src/lib/supabase.ts`, so there is duplicate Supabase setup.
- Some visible text contains encoding artifacts around separators/arrows, likely from mojibake.
- `ReportComplaintPage` analyzes once before confirmation, then `realComplaintService.createComplaint` analyzes again.
- Image upload currently stores a base64 data URL in `image_url`; Supabase Storage would be better for real use.
- `DashboardLayout` notifications are still mock data.
- `AdminAnalytics` still has a hard-coded `resolutionTrend` series mixed with live data.
- RLS policies allow inserts into timeline/notifications mainly for `service_role`, but frontend code attempts some of those inserts/RPC flows with the anon/authenticated client, so permissions should be tested carefully.
