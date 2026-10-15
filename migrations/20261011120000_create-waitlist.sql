-- Waitlist sign-ups from the /join landing pages, plus daily counters for landing-page
-- views and the site-wide try-on cap. The Next.js server is the only caller. It keeps the
-- anon key server-side, and the anon role can reach these tables only through the two
-- functions below.

create table public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email) and length(email) <= 254 and email like '%_@_%._%'),
  variant text not null check (variant in ('looks', 'resell', 'sellers')),
  note text check (length(note) <= 200),
  source text check (length(source) <= 100),
  created_at timestamptz not null default now()
);

create table public.daily_counters (
  key text not null check (length(key) <= 64),
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (key, day)
);

alter table public.waitlist enable row level security;
alter table public.daily_counters enable row level security;
revoke all on public.waitlist, public.daily_counters from anon, authenticated;

-- Returns true for a new sign-up and false when the email is already on the list, so the
-- page can say "you're already on it" without revealing anything else.
create function public.join_waitlist(p_email text, p_variant text, p_note text default null, p_source text default null)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  insert into public.waitlist (email, variant, note, source)
  values (lower(trim(p_email)), p_variant, nullif(trim(p_note), ''), nullif(trim(p_source), ''))
  on conflict (email) do nothing;
  return found;
end;
$$;

-- Adds one to today's (UTC) count for p_key and returns the new count. Returns null without
-- counting when p_cap is set and today's count has already reached it.
create function public.bump_counter(p_key text, p_cap integer default null)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  n integer;
begin
  if p_cap is not null and p_cap <= 0 then
    return null;
  end if;
  insert into public.daily_counters as c (key, day, count)
  values (p_key, (now() at time zone 'utc')::date, 1)
  on conflict (key, day) do update set count = c.count + 1
    where p_cap is null or c.count < p_cap
  returning c.count into n;
  return n;
end;
$$;

revoke execute on function public.join_waitlist(text, text, text, text), public.bump_counter(text, integer) from public;
grant execute on function public.join_waitlist(text, text, text, text), public.bump_counter(text, integer) to anon;

-- The Gate 1 readout: views, sign-ups and sign-up rate for each landing-page variant.
-- Read it from the dashboard's SQL editor: select * from waitlist_results;
create view public.waitlist_results as
select
  v.variant,
  coalesce(views.total, 0) as views,
  coalesce(signups.total, 0) as signups,
  round(100.0 * coalesce(signups.total, 0) / nullif(views.total, 0), 1) as signup_rate_pct
from (values ('looks'), ('resell'), ('sellers')) as v (variant)
left join (
  select substr(key, 6) as variant, sum(count) as total
  from public.daily_counters
  where key like 'view:%'
  group by 1
) as views using (variant)
left join (
  select variant, count(*) as total
  from public.waitlist
  group by 1
) as signups using (variant);

revoke all on public.waitlist_results from anon, authenticated;
