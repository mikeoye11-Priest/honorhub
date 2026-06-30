-- HonorHub — org-level persistence
-- Extends organisations with branding/defaults and adds org-scoped settings
-- tables (signatories now; award categories + template favourites as groundwork).
-- Recipients remain session-only — not modelled here.

-- ----------------------------------------------------------------------------
-- Branding / default wording on the organisation
-- ----------------------------------------------------------------------------
alter table public.organisations
  add column if not exists template          text not null default 'laurel',
  add column if not exists default_award     text,
  add column if not exists default_reason    text,
  add column if not exists default_signatory text,
  add column if not exists footer_text       text;

-- ----------------------------------------------------------------------------
-- Signatories
-- ----------------------------------------------------------------------------
create table if not exists public.signatories (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  role            text,
  active          boolean not null default true,
  sort            integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists signatories_org_idx on public.signatories(organisation_id);

alter table public.signatories enable row level security;

drop policy if exists signatories_select on public.signatories;
create policy signatories_select on public.signatories for select
  using (organisation_id in (select public.user_org_ids()));

drop policy if exists signatories_write on public.signatories;
create policy signatories_write on public.signatories for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));

-- ----------------------------------------------------------------------------
-- Award categories (custom per org; falls back to the catalog when empty)
-- ----------------------------------------------------------------------------
create table if not exists public.award_categories (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  icon            text,
  sort            integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists award_categories_org_idx on public.award_categories(organisation_id);

alter table public.award_categories enable row level security;

drop policy if exists award_categories_select on public.award_categories;
create policy award_categories_select on public.award_categories for select
  using (organisation_id in (select public.user_org_ids()));

drop policy if exists award_categories_write on public.award_categories;
create policy award_categories_write on public.award_categories for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));

-- ----------------------------------------------------------------------------
-- Template favourites
-- ----------------------------------------------------------------------------
create table if not exists public.template_favourites (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  template_key    text not null,
  created_at      timestamptz not null default now(),
  unique (organisation_id, template_key)
);
create index if not exists template_favourites_org_idx on public.template_favourites(organisation_id);

alter table public.template_favourites enable row level security;

drop policy if exists template_favourites_select on public.template_favourites;
create policy template_favourites_select on public.template_favourites for select
  using (organisation_id in (select public.user_org_ids()));

drop policy if exists template_favourites_write on public.template_favourites;
create policy template_favourites_write on public.template_favourites for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
