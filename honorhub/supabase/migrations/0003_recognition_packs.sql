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
