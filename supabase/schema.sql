-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Create the todos table
create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  text        text not null,
  completed   boolean default false not null,
  created_at  timestamptz default now() not null
);

-- 2. Enable Row Level Security (RLS) on todos
alter table public.todos enable row level security;

-- 3. Policy: users can only access their own todos
create policy "Users can manage their own todos"
  on public.todos
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────────────────

-- 4. Create the profiles table (unique username per user)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  created_at  timestamptz default now() not null
);

-- 5. Enable RLS on profiles
alter table public.profiles enable row level security;

-- 6. Anyone logged in can read all profiles (for username uniqueness checks)
create policy "Profiles are readable by authenticated users"
  on public.profiles
  for select
  using ( auth.role() = 'authenticated' );

-- 7. Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );
