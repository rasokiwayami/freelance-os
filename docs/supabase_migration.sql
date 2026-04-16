-- FreelanceOS Migration
-- Supabase SQL Editorで実行してください

-- ─────────────────────────────────────────
-- #5: tasks テーブル
-- ─────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  project_id  uuid references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  is_completed boolean not null default false,
  due_date    date,
  created_at  timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks: own rows" on public.tasks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- #6: project_templates テーブル
-- ─────────────────────────────────────────
create table if not exists public.project_templates (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  name                text not null,
  default_description text,
  default_tasks       jsonb default '[]',
  created_at          timestamptz not null default now()
);
alter table public.project_templates enable row level security;
create policy "templates: own rows" on public.project_templates
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- #8: transactions に payment_status / due_date カラム追加
-- ─────────────────────────────────────────
alter table public.transactions
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid','overdue')),
  add column if not exists due_date date;

-- ─────────────────────────────────────────
-- #11: client_notes テーブル
-- ─────────────────────────────────────────
create table if not exists public.client_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  client_id  uuid references public.clients(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz not null default now()
);
alter table public.client_notes enable row level security;
create policy "client_notes: own rows" on public.client_notes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- #17: chat_history に session_id カラム追加
-- ─────────────────────────────────────────
alter table public.chat_history
  add column if not exists session_id uuid not null default gen_random_uuid(),
  add column if not exists session_name text;

-- ─────────────────────────────────────────
-- #28: user_profiles テーブル
-- ─────────────────────────────────────────
create table if not exists public.user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  default_tax_rate numeric(5,2) not null default 10.00,
  bank_name       text,
  bank_branch     text,
  bank_account_type text default '普通',
  bank_account_number text,
  bank_account_name text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
create policy "profiles: own row" on public.user_profiles
  using (auth.uid() = id) with check (auth.uid() = id);
