# Onboard AI

Recruitment and employee onboarding platform. Next.js 15, React 19, Tailwind, Supabase (Auth, Postgres, Storage, RLS).

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key.
2. In the Supabase SQL editor run, in order:
   - `supabase/migrations/0001_auth_bootstrap.sql`
   - `supabase/migrations/0002_core_modules.sql`
3. In Supabase, Authentication, URL Configuration: add `<site url>/auth/callback` to Redirect URLs.
4. `npm install && npm run dev`

All tables, functions and triggers use the `oa_` prefix so the project can be shared with other apps.

## What works

Sign up, log in, password reset, protected routes, organizations and workspaces, role based access (Row Level Security),
jobs, conversational public applications, candidate CRM with pipeline and history, screening criteria, interviews,
internal conversations, onboarding templates and checklists, employee portal, private document storage, workflow
definitions, career pages, hiring events, analytics with CSV export, team invitations, activity log, AI assistant
configuration and test chat (needs an AI key on the server).

## Not built yet (shown honestly in the app)

Calendar sync, email/SMS/WhatsApp channels, ATS integrations, automatic workflow execution, event registration,
Selar webhook subscription activation, CV upload on the public application.

## Marketing site

Home, Platform, Solutions, Features and Pricing live in `app/(marketing)`. Copy and feature status are in `lib/marketing.ts`.
Pricing comes from `lib/pricing.ts`: the three Selar pages show only price, monthly billing and cancel anytime, so plan names,
descriptions and benefits are left blank there for the owner to fill in.
