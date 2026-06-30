-- HonorHub — demo seed for "Greenfield Primary School"
-- Populates the certificate_exports log with ~9 weeks of believable primary-school
-- recognition activity, so Reports and the Home dashboard look alive in the demo.
--
-- PREREQUISITE: onboard "Greenfield Primary School" in the app first (sign up the
-- workspace), so the organisation exists and your login is its admin. Then run
-- this in the SQL editor of project qjksknhrfzmxbaclcpuy.
--
-- Safe to re-run: it clears this org's existing export log before reseeding.
-- Only touches the named org. No recipient PII is stored (matches the app's model).

do $$
declare
  v_org      uuid;
  v_user     uuid;
  v_awards   text[] := array[
    'Star of the Week','Reading Award','Attendance Star','Kindness Award',
    'Maths Star','Handwriting Hero','Most Improved','Super Scientist',
    'Spelling Champion','Sports Day','Helpful Friend','Wonderful Effort'
  ];
  v_templates text[] := array['excellence','playful','sunbeam','laurel','meadow','confetti','botanical'];
  d          int;
  actions    int;
  k          int;
  dow        int;
  ts         timestamptz;
  n          int := 0;
begin
  select id into v_org
  from public.organisations
  where name = 'Greenfield Primary School'
  order by created_at desc
  limit 1;

  if v_org is null then
    raise exception 'Onboard "Greenfield Primary School" in the app first, then re-run this script.';
  end if;

  -- The org admin (set as created_by where available; the column also allows null)
  select user_id into v_user
  from public.organisation_memberships
  where organisation_id = v_org
  order by created_at asc
  limit 1;

  -- Clean slate for a tidy demo
  delete from public.certificate_exports where organisation_id = v_org;

  -- Walk the last 63 days (9 weeks)
  for d in 0..62 loop
    ts  := now() - (d || ' days')::interval;
    dow := extract(dow from ts); -- 0=Sun … 5=Fri … 6=Sat

    -- Weekends are quiet; weekdays have 0–2 ad-hoc recognition moments
    if dow in (0, 6) then
      actions := (random() < 0.15)::int;       -- the odd weekend event
    else
      actions := floor(random() * 3)::int;     -- 0–2 on a normal day
    end if;

    for k in 1..actions loop
      insert into public.certificate_exports
        (organisation_id, created_by, count, template, award, format, created_at)
      values (
        v_org,
        v_user,
        1 + floor(random() * 5)::int,                                   -- 1–5 certs
        v_templates[1 + floor(random() * array_length(v_templates,1))::int],
        v_awards[1 + floor(random() * array_length(v_awards,1))::int],
        (array['pdf','print','share','link'])[1 + floor(random() * 4)::int],
        ts - (floor(random() * 7) || ' hours')::interval - (floor(random() * 59) || ' minutes')::interval
      );
      n := n + 1;
    end loop;

    -- Friday assembly: a guaranteed "Star of the Week" round for the whole class
    if dow = 5 then
      insert into public.certificate_exports
        (organisation_id, created_by, count, template, award, format, created_at)
      values (
        v_org, v_user,
        24 + floor(random() * 8)::int,   -- a class-sized batch
        'sunbeam', 'Star of the Week', 'pdf',
        ts - interval '4 hours'          -- Friday afternoon
      );
      n := n + 1;
    end if;
  end loop;

  raise notice 'Seeded % export rows for Greenfield Primary School (org %).', n, v_org;
end $$;

-- Quick check after running:
--   select count(*) as actions, sum(count) as certificates
--   from public.certificate_exports
--   where organisation_id = (select id from public.organisations
--                            where name = 'Greenfield Primary School'
--                            order by created_at desc limit 1);
