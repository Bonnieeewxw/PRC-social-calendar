-- PRC Social Calendar Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  publish_date date not null,
  title text not null,
  platforms text[] default '{}',
  owner text default '',
  csa text default '',
  objective text default '',
  source_category text default '',
  campaign text default '',
  status text default 'Planned',
  notes text default '',
  link text default '',
  updated_at timestamptz default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  type text default 'Campaign',
  csa text default '',
  objective text default '',
  source_category text default '',
  status text default 'Planned',
  notes text default '',
  link text default '',
  updated_at timestamptz default now()
);

create table if not exists public.monthly_plans (
  month text primary key,
  focus text default '',
  priorities jsonb default '[]'::jsonb,
  events jsonb default '[]'::jsonb,
  source_counts jsonb default '[]'::jsonb,
  outcome_counts jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.monthly_plans;

-- Demo policy: anyone with the anon key can read/write. For team-only access, enable Supabase Auth and replace these with authenticated-only policies.
alter table public.posts enable row level security;
alter table public.campaigns enable row level security;
alter table public.monthly_plans enable row level security;

create policy "anon read posts" on public.posts for select using (true);
create policy "anon write posts" on public.posts for all using (true) with check (true);
create policy "anon read campaigns" on public.campaigns for select using (true);
create policy "anon write campaigns" on public.campaigns for all using (true) with check (true);
create policy "anon read plans" on public.monthly_plans for select using (true);
create policy "anon write plans" on public.monthly_plans for all using (true) with check (true);
