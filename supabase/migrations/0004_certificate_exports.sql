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
