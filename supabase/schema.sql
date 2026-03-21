-- Knapsack cloud sync table
-- Run this script in Supabase SQL Editor once per project.

create table if not exists public.knapsack_user_data (
  account_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_knapsack_user_data_updated_at
  on public.knapsack_user_data(updated_at desc);

alter table public.knapsack_user_data enable row level security;

-- RLS Policies: Authenticated users can only access their own data
-- account_id must match the authenticated user's UUID (auth.uid())

-- Drop old anon policies (permissive, not secure)
drop policy if exists "knapsack anon read" on public.knapsack_user_data;
drop policy if exists "knapsack anon insert" on public.knapsack_user_data;
drop policy if exists "knapsack anon update" on public.knapsack_user_data;
drop policy if exists "knapsack anon delete" on public.knapsack_user_data;

-- New authenticated-only policy: allows authenticated users to read their own data
create policy "Allow authenticated users to read own data"
  on public.knapsack_user_data
  for select
  to authenticated
  using (account_id = auth.uid()::text);

-- New authenticated-only policy: allows authenticated users to insert their own data
create policy "Allow authenticated users to insert own data"
  on public.knapsack_user_data
  for insert
  to authenticated
  with check (account_id = auth.uid()::text);

-- New authenticated-only policy: allows authenticated users to update their own data
create policy "Allow authenticated users to update own data"
  on public.knapsack_user_data
  for update
  to authenticated
  using (account_id = auth.uid()::text)
  with check (account_id = auth.uid()::text);

-- New authenticated-only policy: allows authenticated users to delete their own data
create policy "Allow authenticated users to delete own data"
  on public.knapsack_user_data
  for delete
  to authenticated
  using (account_id = auth.uid()::text);

-- Optional premium subscription state table
-- Payment webhook/admin panel should write to this table.
-- Frontend only reads the current user's row during login/session restore.

create table if not exists public.knapsack_user_subscriptions (
  account_id uuid primary key references auth.users(id) on delete cascade,
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'premium')),
  billing_status text not null default 'inactive' check (billing_status in ('inactive', 'active', 'trialing', 'grace_period', 'canceled')),
  billing_provider text,
  current_period_end timestamptz,
  premium_since timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_knapsack_user_subscriptions_plan
  on public.knapsack_user_subscriptions(subscription_plan);

alter table public.knapsack_user_subscriptions enable row level security;

drop policy if exists "Allow authenticated users to read own subscription" on public.knapsack_user_subscriptions;

create policy "Allow authenticated users to read own subscription"
  on public.knapsack_user_subscriptions
  for select
  to authenticated
  using (account_id = auth.uid());

-- Entity-based finance storage (UID isolated)
-- These tables back direct CRUD operations from the app for transactions,
-- wallets, fixed expenses, preferences, and categories.

create table if not exists public.knapsack_transactions (
  account_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (account_id, id)
);

create table if not exists public.knapsack_wallets (
  account_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (account_id, id)
);

create table if not exists public.knapsack_fixed_expenses (
  account_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (account_id, id)
);

create table if not exists public.knapsack_user_preferences (
  account_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.knapsack_user_categories (
  account_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.knapsack_transactions enable row level security;
alter table public.knapsack_wallets enable row level security;
alter table public.knapsack_fixed_expenses enable row level security;
alter table public.knapsack_user_preferences enable row level security;
alter table public.knapsack_user_categories enable row level security;

drop policy if exists "Allow authenticated users to read own transactions" on public.knapsack_transactions;
drop policy if exists "Allow authenticated users to insert own transactions" on public.knapsack_transactions;
drop policy if exists "Allow authenticated users to update own transactions" on public.knapsack_transactions;
drop policy if exists "Allow authenticated users to delete own transactions" on public.knapsack_transactions;

create policy "Allow authenticated users to read own transactions"
  on public.knapsack_transactions
  for select
  to authenticated
  using (account_id = auth.uid());

create policy "Allow authenticated users to insert own transactions"
  on public.knapsack_transactions
  for insert
  to authenticated
  with check (account_id = auth.uid());

create policy "Allow authenticated users to update own transactions"
  on public.knapsack_transactions
  for update
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "Allow authenticated users to delete own transactions"
  on public.knapsack_transactions
  for delete
  to authenticated
  using (account_id = auth.uid());

drop policy if exists "Allow authenticated users to read own wallets" on public.knapsack_wallets;
drop policy if exists "Allow authenticated users to insert own wallets" on public.knapsack_wallets;
drop policy if exists "Allow authenticated users to update own wallets" on public.knapsack_wallets;
drop policy if exists "Allow authenticated users to delete own wallets" on public.knapsack_wallets;

create policy "Allow authenticated users to read own wallets"
  on public.knapsack_wallets
  for select
  to authenticated
  using (account_id = auth.uid());

create policy "Allow authenticated users to insert own wallets"
  on public.knapsack_wallets
  for insert
  to authenticated
  with check (account_id = auth.uid());

create policy "Allow authenticated users to update own wallets"
  on public.knapsack_wallets
  for update
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "Allow authenticated users to delete own wallets"
  on public.knapsack_wallets
  for delete
  to authenticated
  using (account_id = auth.uid());

drop policy if exists "Allow authenticated users to read own fixed expenses" on public.knapsack_fixed_expenses;
drop policy if exists "Allow authenticated users to insert own fixed expenses" on public.knapsack_fixed_expenses;
drop policy if exists "Allow authenticated users to update own fixed expenses" on public.knapsack_fixed_expenses;
drop policy if exists "Allow authenticated users to delete own fixed expenses" on public.knapsack_fixed_expenses;

create policy "Allow authenticated users to read own fixed expenses"
  on public.knapsack_fixed_expenses
  for select
  to authenticated
  using (account_id = auth.uid());

create policy "Allow authenticated users to insert own fixed expenses"
  on public.knapsack_fixed_expenses
  for insert
  to authenticated
  with check (account_id = auth.uid());

create policy "Allow authenticated users to update own fixed expenses"
  on public.knapsack_fixed_expenses
  for update
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "Allow authenticated users to delete own fixed expenses"
  on public.knapsack_fixed_expenses
  for delete
  to authenticated
  using (account_id = auth.uid());

drop policy if exists "Allow authenticated users to read own preferences" on public.knapsack_user_preferences;
drop policy if exists "Allow authenticated users to upsert own preferences" on public.knapsack_user_preferences;
drop policy if exists "Allow authenticated users to delete own preferences" on public.knapsack_user_preferences;

create policy "Allow authenticated users to read own preferences"
  on public.knapsack_user_preferences
  for select
  to authenticated
  using (account_id = auth.uid());

create policy "Allow authenticated users to insert own preferences"
  on public.knapsack_user_preferences
  for insert
  to authenticated
  with check (account_id = auth.uid());

create policy "Allow authenticated users to update own preferences"
  on public.knapsack_user_preferences
  for update
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "Allow authenticated users to delete own preferences"
  on public.knapsack_user_preferences
  for delete
  to authenticated
  using (account_id = auth.uid());

drop policy if exists "Allow authenticated users to read own categories" on public.knapsack_user_categories;
drop policy if exists "Allow authenticated users to upsert own categories" on public.knapsack_user_categories;
drop policy if exists "Allow authenticated users to delete own categories" on public.knapsack_user_categories;

create policy "Allow authenticated users to read own categories"
  on public.knapsack_user_categories
  for select
  to authenticated
  using (account_id = auth.uid());

create policy "Allow authenticated users to insert own categories"
  on public.knapsack_user_categories
  for insert
  to authenticated
  with check (account_id = auth.uid());

create policy "Allow authenticated users to update own categories"
  on public.knapsack_user_categories
  for update
  to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "Allow authenticated users to delete own categories"
  on public.knapsack_user_categories
  for delete
  to authenticated
  using (account_id = auth.uid());
