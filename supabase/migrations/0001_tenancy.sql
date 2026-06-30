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
