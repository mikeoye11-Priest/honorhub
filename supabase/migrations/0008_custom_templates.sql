-- HonorHub — custom (bring-your-own) certificate templates
-- A school uploads their own certificate design (image, or a PDF we rasterise to
-- an image) and positions the recipient/award/date/etc. fields on top of it.
-- This is ORG BRANDING, not pupil data — the template + field layout are stored,
-- but recipient names/messages stay session-only (see the privacy stance).

create table if not exists public.custom_templates (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  name            text not null,
  background      text not null,                 -- PNG/JPEG data URL (PDF is rasterised before save)
  aspect          numeric not null default 1.4142, -- width / height of the uploaded design
  fields          jsonb not null default '[]'::jsonb, -- [{ key, x, y, width, fontSize, color, align, weight, uppercase }]
  created_at      timestamptz not null default now()
);
create index if not exists custom_templates_org_idx on public.custom_templates(organisation_id);

alter table public.custom_templates enable row level security;

-- Any member of the org can use (read) the org's custom templates.
drop policy if exists custom_templates_select on public.custom_templates;
create policy custom_templates_select on public.custom_templates for select
  using (organisation_id in (select public.user_org_ids()));

-- Admins/managers create, edit and delete them (template management is an admin task).
drop policy if exists custom_templates_write on public.custom_templates;
create policy custom_templates_write on public.custom_templates for all
  using (public.is_org_admin(organisation_id)) with check (public.is_org_admin(organisation_id));
