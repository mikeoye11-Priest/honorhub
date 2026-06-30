-- HonorHub — full schema (migrations 0001–0007 concatenated, in order)
-- For setting up a FRESH database. Paste into the SQL editor of project
-- qjksknhrfzmxbaclcpuy and Run. (Already-migrated DBs only need the latest
-- numbered migration.)

-- ============================================================
-- migrations/0001_tenancy.sql
-- ============================================================
-- HonorHub — multi-tenant foundation
-- accounts → organisations → memberships → profiles, with row-level security.
-- A signup trigger provisions an account + organisation + admin membership for
-- every new user. Recipient data is NOT modelled here — it stays session-only by
-- design (PRD privacy stance); the opt-in Recipient Directory is a later migration.

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'professional',
  created_at  timestamptz not null default now()
);

create table if not exists public.organisations (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  name        text not null,
  vertical    text not null default 'school'
              check (vertical in ('school','church','sports','company','charity','event')),
  logo_url    text,
  accent      text not null default '#F58220',
  created_at  timestamptz not null default now()
);
create index if not exists organisations_account_id_idx on public.organisations(account_id);

-- Mirrors auth.users (Supabase manages the auth schema; we keep app profile data here)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.organisation_memberships (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null default 'admin'
                  check (role in ('admin','manager','contributor','viewer')),
  created_at      timestamptz not null default now(),
  unique (organisation_id, user_id)
);
create index if not exists memberships_user_id_idx on public.organisation_memberships(user_id);
create index if not exists memberships_org_id_idx on public.organisation_memberships(organisation_id);

-- ----------------------------------------------------------------------------
-- Helper: the org ids the current user belongs to.
-- SECURITY DEFINER bypasses RLS, which avoids recursive policy evaluation when
-- the policies below reference membership.
-- ----------------------------------------------------------------------------
create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organisation_id from public.organisation_memberships where user_id = auth.uid();
$$;

create or replace function public.is_org_admin(org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organisation_memberships
    where organisation_id = org and user_id = auth.uid() and role in ('admin','manager')
  );
$$;

-- ----------------------------------------------------------------------------
-- Row-level security
-- ----------------------------------------------------------------------------
alter table public.accounts enable row level security;
alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.organisation_memberships enable row level security;

-- accounts: visible if you belong to one of its organisations
drop policy if exists accounts_select on public.accounts;
create policy accounts_select on public.accounts for select
  using (id in (select account_id from public.organisations where id in (select public.user_org_ids())));

-- organisations: members can read; admins/managers can update
drop policy if exists organisations_select on public.organisations;
create policy organisations_select on public.organisations for select
  using (id in (select public.user_org_ids()));

drop policy if exists organisations_update on public.organisations;
create policy organisations_update on public.organisations for update
  using (public.is_org_admin(id)) with check (public.is_org_admin(id));

-- profiles: you can always see and edit yourself; you can see fellow org members
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select user_id from public.organisation_memberships
      where organisation_id in (select public.user_org_ids())
    )
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- memberships: visible for orgs you belong to; admins/managers can manage
drop policy if exists memberships_select on public.organisation_memberships;
create policy memberships_select on public.organisation_memberships for select
  using (organisation_id in (select public.user_org_ids()));

drop policy if exists memberships_write on public.organisation_memberships;
create policy memberships_write on public.organisation_memberships for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));

-- ----------------------------------------------------------------------------
-- Signup trigger: provision account + organisation + admin membership.
-- Reads organisation name / vertical / full name from the signUp metadata.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acc_id   uuid;
  org_id   uuid;
  org_name text := coalesce(nullif(new.raw_user_meta_data->>'organisation_name', ''), 'My Organisation');
  vert     text := coalesce(nullif(new.raw_user_meta_data->>'vertical', ''), 'school');
begin
  insert into public.profiles (id, full_name, email)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email);

  insert into public.accounts (name) values (org_name) returning id into acc_id;

  insert into public.organisations (account_id, name, vertical)
    values (acc_id, org_name, vert) returning id into org_id;

  insert into public.organisation_memberships (organisation_id, user_id, role)
    values (org_id, new.id, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- migrations/0002_org_settings.sql
-- ============================================================
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


-- ============================================================
-- migrations/0003_recognition_packs.sql
-- ============================================================
-- HonorHub — Recognition Packs (custom, per-organisation)
-- Built-in catalog packs stay in the frontend; these are the org's own saved packs.
-- A pack is a named family of outputs (certificates + extras) in one consistent style.

create table if not exists public.recognition_packs (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  sectors         text[] not null default '{}',
  blurb           text,
  sort            integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists recognition_packs_org_idx on public.recognition_packs(organisation_id);

create table if not exists public.pack_items (
  id          uuid primary key default gen_random_uuid(),
  pack_id     uuid not null references public.recognition_packs(id) on delete cascade,
  label       text not null,
  kind        text not null default 'certificate'
              check (kind in ('certificate','badge','social','card','banner','email')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists pack_items_pack_idx on public.pack_items(pack_id);

-- ----------------------------------------------------------------------------
-- Row-level security
-- ----------------------------------------------------------------------------
alter table public.recognition_packs enable row level security;
alter table public.pack_items enable row level security;

drop policy if exists recognition_packs_select on public.recognition_packs;
create policy recognition_packs_select on public.recognition_packs for select
  using (organisation_id in (select public.user_org_ids()));

drop policy if exists recognition_packs_write on public.recognition_packs;
create policy recognition_packs_write on public.recognition_packs for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));

-- pack_items inherit access from their parent pack's organisation
drop policy if exists pack_items_select on public.pack_items;
create policy pack_items_select on public.pack_items for select
  using (pack_id in (select id from public.recognition_packs where organisation_id in (select public.user_org_ids())));

drop policy if exists pack_items_write on public.pack_items;
create policy pack_items_write on public.pack_items for all
  using (pack_id in (select id from public.recognition_packs where public.is_org_admin(organisation_id)))
  with check (pack_id in (select id from public.recognition_packs where public.is_org_admin(organisation_id)));


-- ============================================================
-- migrations/0004_certificate_exports.sql
-- ============================================================
-- HonorHub — certificate exports log
-- One row per generate action (print/download), so dashboards and a future
-- Recognition Timeline have real activity to count. Recipient NAMES are NOT
-- stored — only counts and template/award metadata — keeping the privacy stance.

create table if not exists public.certificate_exports (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  count           integer not null default 1,   -- certificates in this export
  template        text,
  award           text,
  pack_key        text,                          -- set when generated from a pack
  format          text not null default 'pdf',
  created_at      timestamptz not null default now()
);
create index if not exists certificate_exports_org_idx on public.certificate_exports(organisation_id);
create index if not exists certificate_exports_created_idx on public.certificate_exports(organisation_id, created_at desc);

alter table public.certificate_exports enable row level security;

drop policy if exists certificate_exports_select on public.certificate_exports;
create policy certificate_exports_select on public.certificate_exports for select
  using (organisation_id in (select public.user_org_ids()));

-- Any member of the org can log an export they generated
drop policy if exists certificate_exports_insert on public.certificate_exports;
create policy certificate_exports_insert on public.certificate_exports for insert
  with check (organisation_id in (select public.user_org_ids()));


-- ============================================================
-- migrations/0005_invites.sql
-- ============================================================
-- HonorHub — organisation invites
-- An admin creates an invite (email + role + token); the invitee joins the org
-- on signup via accept_invite(). Invited signups skip the usual auto-provisioned
-- org so the new member lands directly in the inviting organisation.

create table if not exists public.organisation_invites (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email           text not null,
  role            text not null default 'contributor'
                  check (role in ('admin','manager','contributor','viewer')),
  token           text not null unique,
  status          text not null default 'pending'
                  check (status in ('pending','accepted','revoked')),
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  accepted_at     timestamptz
);
create index if not exists organisation_invites_org_idx on public.organisation_invites(organisation_id);

alter table public.organisation_invites enable row level security;

-- Only org admins/managers manage invites
drop policy if exists organisation_invites_admin on public.organisation_invites;
create policy organisation_invites_admin on public.organisation_invites for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));

-- ----------------------------------------------------------------------------
-- accept_invite: the current user joins the invite's org. SECURITY DEFINER so a
-- non-admin invitee can self-join despite the admin-only RLS above.
-- ----------------------------------------------------------------------------
create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.organisation_invites%rowtype;
begin
  select * into inv from public.organisation_invites where token = p_token and status = 'pending';
  if inv.id is null then
    return null;
  end if;

  insert into public.organisation_memberships (organisation_id, user_id, role)
    values (inv.organisation_id, auth.uid(), inv.role)
    on conflict (organisation_id, user_id) do nothing;

  update public.organisation_invites set status = 'accepted', accepted_at = now() where id = inv.id;
  return inv.organisation_id;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Skip auto-provisioning a new org when the signup carries an invite token —
-- the invited user joins an existing org via accept_invite() instead.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acc_id   uuid;
  org_id   uuid;
  org_name text := coalesce(nullif(new.raw_user_meta_data->>'organisation_name', ''), 'My Organisation');
  vert     text := coalesce(nullif(new.raw_user_meta_data->>'vertical', ''), 'school');
begin
  insert into public.profiles (id, full_name, email)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email);

  -- Invited users join an existing org via accept_invite — don't create a new one
  if coalesce(new.raw_user_meta_data->>'invite_token', '') <> '' then
    return new;
  end if;

  insert into public.accounts (name) values (org_name) returning id into acc_id;
  insert into public.organisations (account_id, name, vertical)
    values (acc_id, org_name, vert) returning id into org_id;
  insert into public.organisation_memberships (organisation_id, user_id, role)
    values (org_id, new.id, 'admin');
  return new;
end;
$$;


-- ============================================================
-- migrations/0006_shared_certificates.sql
-- ============================================================
-- HonorHub — shared certificates
-- Backs the "Copy share link" option on the Create success screen. A member
-- saves the rendered certificate (design + the single recipient they are
-- sharing) under an unguessable slug; anyone with the link can view it on the
-- public /c/:slug page. Unlike the analytics log, this row DOES carry the
-- recipient's name and message — it only exists because the user chose to share
-- that specific certificate publicly.

create table if not exists public.shared_certificates (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  template        text not null,
  accent          text not null,
  logo            text,
  org             text not null,
  award           text not null,
  recipient_name  text not null,
  reason          text,
  signatory       text,
  cert_date       text,
  created_at      timestamptz not null default now()
);
create index if not exists shared_certificates_org_idx on public.shared_certificates(organisation_id);

alter table public.shared_certificates enable row level security;

-- Members of the org may create share links for their org's certificates…
drop policy if exists shared_certificates_insert on public.shared_certificates;
create policy shared_certificates_insert on public.shared_certificates for insert
  with check (organisation_id in (select public.user_org_ids()));

-- …and manage (read/delete) their own org's shares.
drop policy if exists shared_certificates_select on public.shared_certificates;
create policy shared_certificates_select on public.shared_certificates for select
  using (organisation_id in (select public.user_org_ids()));

drop policy if exists shared_certificates_delete on public.shared_certificates;
create policy shared_certificates_delete on public.shared_certificates for delete
  using (organisation_id in (select public.user_org_ids()));

-- ----------------------------------------------------------------------------
-- Public read by slug. SECURITY DEFINER so an anonymous visitor (no membership)
-- can resolve exactly ONE certificate by its unguessable slug, without being
-- able to enumerate the table directly. Returns only the fields needed to draw
-- the certificate — never organisation_id or created_by.
-- ----------------------------------------------------------------------------
create or replace function public.get_shared_certificate(p_slug text)
returns table (
  template       text,
  accent         text,
  logo           text,
  org            text,
  award          text,
  recipient_name text,
  reason         text,
  signatory      text,
  cert_date      text,
  created_at     timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select template, accent, logo, org, award, recipient_name, reason, signatory, cert_date, created_at
  from public.shared_certificates
  where slug = p_slug;
$$;

grant execute on function public.get_shared_certificate(text) to anon, authenticated;


-- ============================================================
-- migrations/0007_shared_certificates_no_pii.sql
-- ============================================================
-- HonorHub — remove pupil PII from shared certificates
-- Privacy stance: we do NOT persist recipient (pupil) details server-side. The
-- share link still works, but the recipient's name + message now travel only in
-- the URL fragment (client-side, never sent to the server). The DB row keeps
-- just the non-PII design (template/accent/logo/org/award/signatory/date).

-- The function returns these columns, so drop it before altering the table.
drop function if exists public.get_shared_certificate(text);

alter table public.shared_certificates
  drop column if exists recipient_name,
  drop column if exists reason;

create function public.get_shared_certificate(p_slug text)
returns table (
  template   text,
  accent     text,
  logo       text,
  org        text,
  award      text,
  signatory  text,
  cert_date  text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select template, accent, logo, org, award, signatory, cert_date, created_at
  from public.shared_certificates
  where slug = p_slug;
$$;

grant execute on function public.get_shared_certificate(text) to anon, authenticated;


