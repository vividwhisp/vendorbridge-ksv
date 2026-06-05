-- =============================================================
--  DataHub — full migration (workflow + RBAC + uploads + realtime)
--  Safe to re-run. Targets a DB that currently only has the
--  basic `products` table.
-- =============================================================

-- ─── 1. WORKFLOW: add `status` column to products ──────────────
alter table products
  add column if not exists status text not null default 'Active';

-- ─── 2. RBAC: profiles table + trigger ────────────────────────
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = user_id);

-- Trigger: every new auth.users row gets a 'user' profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 3. PRODUCTS: RLS (idempotent) ─────────────────────────────
alter table products enable row level security;

drop policy if exists "Users can view own products"   on products;
drop policy if exists "Users can insert own products" on products;
drop policy if exists "Users can update own products" on products;
drop policy if exists "Users can delete own products" on products;

create policy "Users can view own products"
  on products for select using (auth.uid() = user_id);
create policy "Users can insert own products"
  on products for insert with check (auth.uid() = user_id);
create policy "Users can update own products"
  on products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own products"
  on products for delete using (auth.uid() = user_id);

-- ─── 4. REALTIME: stream changes to the dashboard ──────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table products;
  end if;
end $$;

-- ─── 5. FILE UPLOADS: bucket + RLS ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can upload to own folder"   on storage.objects;
drop policy if exists "Users can update own uploads"     on storage.objects;
drop policy if exists "Users can delete own uploads"     on storage.objects;
drop policy if exists "Users can read own uploads"       on storage.objects;

create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can update own uploads"
  on storage.objects for update
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Users can delete own uploads"
  on storage.objects for delete
  using (
    bucket_id = 'uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
-- Bucket is public -> reads are open. To restrict, uncomment below
-- and toggle the bucket to Private in the Supabase dashboard.
-- create policy "Users can read own uploads"
--   on storage.objects for select
--   using (
--     bucket_id = 'uploads'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );

-- =============================================================
--  6. BOOTSTRAP: promote kori@dev.com to admin
-- =============================================================
--  The trigger above gave kori@dev.com a 'user' profile.
--  Run this one UPDATE to make that account the demo admin.
--  You only need it once, and only for the demo account.
-- =============================================================

update profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'kori@dev.com');

-- Verify:
-- select u.email, p.role
-- from profiles p
-- join auth.users u on u.id = p.user_id;
