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
