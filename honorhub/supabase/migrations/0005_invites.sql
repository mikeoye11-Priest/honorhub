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
