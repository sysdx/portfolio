-- Reputation OS: phase 2 schema. Mirrors lib/types.ts. Apply with the Supabase CLI or MCP.
-- Every table has row level security on. Only the signed-in owner can read or write,
-- except the public_* views, which expose verified, approved records to the portfolio.

create extension if not exists "pgcrypto";

create table owners (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from owners where user_id = auth.uid());
$$;

create table settings (
  id int primary key default 1 check (id = 1),
  github_user text not null default '',
  codeforces_handle text not null default '',
  atcoder_handle text not null default '',
  kaggle_user text not null default '',
  monthly_budget_usd numeric not null default 0,
  autonomy_level int not null default 2 check (autonomy_level between 0 and 3),
  timezone text not null default 'America/New_York',
  watchlist text[] not null default '{bitcoin,ethereum,solana}',
  mascot_enabled boolean not null default true
);

create table sources (
  id text primary key,
  name text not null,
  url text not null,
  authority text not null check (authority in ('official','community','manual')),
  access text not null check (access in ('public-api','needs-key','manual-entry')),
  refresh text not null check (refresh in ('daily','weekly','manual')),
  permitted_use text not null default '',
  last_checked_at timestamptz,
  health text not null default 'unchecked' check (health in ('ok','error','unchecked')),
  last_error text not null default ''
);

create table campaigns (
  id text primary key,
  title text not null,
  platform text not null,
  target text not null,
  requirements_url text not null default '',
  requirements_checked_at timestamptz,
  official_status text not null default '',
  official_status_evidence text not null default '',
  official_status_checked_at timestamptz,
  internal_estimate text not null default '',
  skills text[] not null default '{}',
  weekly_hours numeric not null default 0,
  restrictions text not null default '',
  next_action text not null default '',
  linked_source_ids text[] not null default '{}',
  check (official_status = '' or official_status_evidence ~ '^https?://')
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references campaigns on delete cascade,
  title text not null,
  done boolean not null default false,
  evidence_url text not null default '',
  done_at timestamptz,
  check (not done or evidence_url ~ '^https?://')
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('competition','hackathon','bounty','research')),
  name text not null,
  platform text not null default '',
  url text not null default '',
  deadline timestamptz,
  eligibility text not null default '',
  ai_policy text not null default '',
  priority text not null default 'medium',
  status text not null default 'watching' check (status in ('watching','entered','skipped')),
  campaign_id text references campaigns,
  source_id text references sources,
  source_url text not null default '',
  retrieved_at timestamptz not null default now(),
  verification text not null default 'unconfirmed' check (verification in ('verified','estimated','unconfirmed')),
  check (status <> 'entered' or (eligibility <> '' and ai_policy <> '')),
  check (verification <> 'verified' or source_url ~ '^https?://')
);

create table events (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  kind text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  campaign_id text references campaigns,
  opportunity_id uuid references opportunities on delete cascade,
  recurrence text not null default 'none' check (recurrence in ('none','weekly')),
  notes text not null default '',
  source_id text references sources,
  source_url text not null default '',
  retrieved_at timestamptz not null default now(),
  verification text not null default 'unconfirmed' check (verification in ('verified','estimated','unconfirmed'))
);

-- Fact history: every change to an event keeps the previous value.
create table event_history (
  id bigint generated always as identity primary key,
  event_id uuid not null references events on delete cascade,
  at timestamptz not null default now(),
  field text not null,
  old_value text,
  new_value text,
  changed_by text not null
);

create or replace function record_event_change() returns trigger language plpgsql as $$
begin
  if new.starts_at is distinct from old.starts_at then
    insert into event_history(event_id, field, old_value, new_value, changed_by) values (old.id, 'start', old.starts_at::text, new.starts_at::text, coalesce(current_setting('app.actor', true), 'unknown'));
  end if;
  if new.ends_at is distinct from old.ends_at then
    insert into event_history(event_id, field, old_value, new_value, changed_by) values (old.id, 'end', old.ends_at::text, new.ends_at::text, coalesce(current_setting('app.actor', true), 'unknown'));
  end if;
  if new.title is distinct from old.title then
    insert into event_history(event_id, field, old_value, new_value, changed_by) values (old.id, 'title', old.title, new.title, coalesce(current_setting('app.actor', true), 'unknown'));
  end if;
  return new;
end $$;
create trigger events_history before update on events for each row execute function record_event_change();

create table tasks (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  title text not null,
  command text not null,
  source text not null check (source in ('dashboard','claude-desktop','assistant')),
  operation text,
  owner_role_id text not null,
  reviewer_role_id text not null,
  depends_on uuid[] not null default '{}',
  risk text not null check (risk in ('low','medium','high')),
  needs_approval boolean not null,
  status text not null,
  attempts int not null default 0,
  completion_criteria text not null default '',
  evidence jsonb not null default '[]',
  log text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_role_id <> reviewer_role_id)
);

create table gate_results (
  id bigint generated always as identity primary key,
  task_id uuid not null references tasks on delete cascade,
  gate text not null,
  passed boolean not null,
  by_role text not null,
  at timestamptz not null default now(),
  note text not null default ''
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null default '',
  date date not null,
  category text not null,
  evidence_url text not null default '',
  notes text not null default '',
  verified boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private','public')),
  created_at timestamptz not null default now(),
  check (visibility = 'private' or (verified and evidence_url ~ '^https?://'))
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  detail text not null default '',
  module text not null,
  cost_usd numeric not null default 0,
  ref_type text,
  ref_id uuid,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table research (id uuid primary key default gen_random_uuid(), title text not null, kind text not null, status text not null, repo_url text not null default '', summary text not null default '', visibility text not null default 'private', check (visibility = 'private' or repo_url ~ '^https?://'));
create table content (id uuid primary key default gen_random_uuid(), channel text not null, title text not null, body text not null default '', status text not null default 'draft', scheduled_for text not null default '', created_at timestamptz not null default now(), published_at timestamptz);
create table experiments (id uuid primary key default gen_random_uuid(), competition text not null default '', name text not null, approach text not null default '', cv_score text not null default '', lb_score text not null default '', notes text not null default '', status text not null default 'planned', created_at timestamptz not null default now());
create table hackathons (id uuid primary key default gen_random_uuid(), name text not null, platform text not null default '', url text not null default '', deadline date, stage text not null default 'idea', notes text not null default '');
create table contests (id uuid primary key default gen_random_uuid(), platform text not null, contest text not null, date date, solved text not null default '', upsolve_notes text not null default '');
create table problems (id uuid primary key default gen_random_uuid(), platform text not null, ref text not null, title text not null, difficulty text not null default '', topics text[] not null default '{}', mode text not null check (mode in ('independent','assisted')), solved_at date not null, review_count int not null default 0, next_review date not null, unique (platform, ref));
create table bounty_programs (id uuid primary key default gen_random_uuid(), name text not null, platform text not null default '', url text not null default '', age_requirement text not null default '', in_scope text not null default '', out_of_scope text not null default '', rules text not null default '', authorization_confirmed boolean not null default false, confirmed_at timestamptz, status text not null default 'researching', check (not authorization_confirmed or (url <> '' and in_scope <> '' and age_requirement <> '')));
create table bounty_reports (id uuid primary key default gen_random_uuid(), program_id uuid not null references bounty_programs, title text not null, status text not null default 'draft', notes text not null default '', created_at timestamptz not null default now());
create table messages (id uuid primary key default gen_random_uuid(), name text not null, email text not null, body text not null, created_at timestamptz not null default now(), read boolean not null default false);
create table sim_trades (id uuid primary key default gen_random_uuid(), at timestamptz not null default now(), asset text not null, side text not null check (side in ('buy','sell')), qty numeric not null check (qty > 0), price_usd numeric not null, price_source text not null, price_fetched_at timestamptz not null);
create table audit (id bigint generated always as identity primary key, at timestamptz not null default now(), action text not null, detail text not null default '');

-- Decision memory: append-only. No update or delete policy exists, so nobody can rewrite it.
create table lessons (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), task_id uuid references tasks, campaign_id text references campaigns, attempted text not null, tools_and_sources text not null default '', happened text not null default '', evidence text not null default '', verified boolean not null default false, failed text not null default '', change_next text not null default '');

-- Row level security everywhere.
do $$
declare t text;
begin
  foreach t in array array['owners','settings','sources','campaigns','milestones','opportunities','events','event_history','tasks','gate_results','achievements','approvals','research','content','experiments','hackathons','contests','problems','bounty_programs','bounty_reports','messages','sim_trades','audit','lessons'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
  foreach t in array array['settings','sources','campaigns','milestones','opportunities','events','tasks','gate_results','achievements','approvals','research','content','experiments','hackathons','contests','problems','bounty_programs','bounty_reports','messages','sim_trades'] loop
    execute format('create policy owner_all on %I for all using (is_owner()) with check (is_owner())', t);
  end loop;
end $$;

create policy owner_read on owners for select using (user_id = auth.uid());
create policy owner_read on event_history for select using (is_owner());
create policy owner_read on audit for select using (is_owner());
create policy owner_insert on audit for insert with check (is_owner());
create policy owner_read on lessons for select using (is_owner());
create policy owner_insert on lessons for insert with check (is_owner());
-- Anyone may send a contact message; only the owner can read them.
create policy public_insert on messages for insert with check (true);

-- What the public portfolio may read.
create view public_achievements with (security_invoker = false) as
  select id, title, issuer, date, category, evidence_url, notes from achievements where verified and visibility = 'public';
create view public_research with (security_invoker = false) as
  select id, title, kind, status, repo_url, summary from research where visibility = 'public';
create view public_posts with (security_invoker = false) as
  select id, title, body, published_at from content where channel = 'blog' and status = 'published';
grant select on public_achievements, public_research, public_posts to anon, authenticated;
