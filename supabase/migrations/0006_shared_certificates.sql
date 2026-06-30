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
