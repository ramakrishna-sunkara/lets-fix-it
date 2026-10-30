-- LET'S FIX IT AI — initial schema with RLS

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  phone text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  status text not null default 'gathering',
  product_summary jsonb not null default '{}'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  diagnosis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repair_sessions_user_id_idx
  on public.repair_sessions (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.repair_sessions enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users upsert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users read own repair sessions"
  on public.repair_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own repair sessions"
  on public.repair_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own repair sessions"
  on public.repair_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own repair sessions"
  on public.repair_sessions for delete
  using (auth.uid() = user_id);

-- Private evidence images bucket (create in dashboard if not present)
insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', false)
on conflict (id) do nothing;

create policy "Users read own session images"
  on storage.objects for select
  using (
    bucket_id = 'session-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users upload own session images"
  on storage.objects for insert
  with check (
    bucket_id = 'session-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
