# HonorHub Backend Setup (Supabase)

The app runs in **demo mode** (no login, local-only state) until Supabase env vars are
present. Add them and it switches to real auth + multi-tenant data with row-level security.
The public Vercel demo keeps working either way.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Pick a region near your users.
2. Save the project's **Project URL** and **anon public key** (Settings → API).

## 2. Run the migration

In the Supabase dashboard → **SQL Editor**, paste and run the contents of:

```
honorhub/supabase/migrations/0001_tenancy.sql
```

This creates `accounts`, `organisations`, `organisation_memberships`, `profiles`, enables
row-level security on all of them, and adds a signup trigger that provisions an account +
organisation + admin membership for every new user.

*(Or, with the Supabase CLI: `supabase db push` from `honorhub/`.)*

## 3. Auth settings

- **Email confirmation:** Supabase → Authentication → Providers → Email. For quick testing
  you can turn **"Confirm email" off** so signup logs you straight in. Leave it on for
  production (the app shows a "check your email" screen).

## 4. Environment variables

Two public client vars (safe to expose — they're the anon key, protected by RLS):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

- **Local dev:** create `honorhub/.env.local` with the two lines above, then `npm run dev`.
- **Vercel:** Project → Settings → Environment Variables → add both (Production + Preview),
  then redeploy.

> Note: `ANTHROPIC_API_KEY` is a **server-side** secret for `api/reasons.js` — set it only in
> Vercel, never with a `VITE_` prefix (that would ship it to the browser).

## 5. Verify

- Open the app → you're redirected to **/login**.
- **Create a workspace** (name + organisation + workspace type) → you land in the dashboard
  as an admin of a new organisation.
- The sidebar switcher now lists your real **organisations**; switching one re-themes
  terminology to that org's vertical.

## What's modelled (and what isn't)

Stored (per the PRD "store by default" list, foundation slice):
`accounts`, `organisations` (name, vertical, accent, logo), `organisation_memberships`
(roles), `profiles`.

**Not** stored yet — recipients. Recipient names/messages stay **session-only** by design;
the opt-in Recipient Directory + Recognition Timeline are a later migration. Org-level
branding/signatories/categories and Recognition Packs persistence are the next backend slices.
