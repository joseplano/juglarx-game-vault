-- ============================================
-- JuglarX Game Vault - Initial Migration
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- or via supabase CLI: supabase db push

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Games: cached IGDB data or manually created entries
create table public.games (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  igdb_id bigint,
  source text not null default 'IGDB' check (source in ('IGDB', 'MANUAL')),
  title text not null,
  genre text[] not null default '{}',
  saga text,
  platform text not null,
  release_date date,
  summary text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- Unique: one IGDB game per owner (NULL igdb_id allowed for manual entries)
create unique index idx_games_owner_igdb
  on public.games(owner_id, igdb_id)
  where igdb_id is not null;

-- Items: physical copies in the collection
create table public.items (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  region text,
  condition text not null default 'GOOD'
    check (condition in ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR')),
  completeness text not null default 'CIB'
    check (completeness in (
      'CARTRIDGE_ONLY', 'CIB', 'BOX_ONLY', 'MANUAL_ONLY',
      'BOX_AND_MANUAL_NO_EXTRAS', 'OTHER'
    )),
  has_cartridge boolean not null default true,
  has_box boolean not null default false,
  has_manual boolean not null default false,
  has_extras boolean not null default false,
  notes text,
  barcode text,
  created_at timestamptz not null default now()
);

-- Photos: images attached to items
create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  kind text not null check (kind in ('BOX', 'CARTRIDGE', 'MANUAL', 'EXTRAS', 'OTHER')),
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_games_owner on public.games(owner_id);
create index idx_games_title on public.games using gin(to_tsvector('english', title));
create index idx_items_owner on public.items(owner_id);
create index idx_items_game on public.items(game_id);
create index idx_items_barcode on public.items(barcode) where barcode is not null;
create index idx_photos_item on public.photos(item_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.games enable row level security;
alter table public.items enable row level security;
alter table public.photos enable row level security;

-- Games policies
create policy "games_select_own" on public.games
  for select using (auth.uid() = owner_id);
create policy "games_insert_own" on public.games
  for insert with check (auth.uid() = owner_id);
create policy "games_update_own" on public.games
  for update using (auth.uid() = owner_id);
create policy "games_delete_own" on public.games
  for delete using (auth.uid() = owner_id);

-- Items policies
create policy "items_select_own" on public.items
  for select using (auth.uid() = owner_id);
create policy "items_insert_own" on public.items
  for insert with check (auth.uid() = owner_id);
create policy "items_update_own" on public.items
  for update using (auth.uid() = owner_id);
create policy "items_delete_own" on public.items
  for delete using (auth.uid() = owner_id);

-- Photos policies
create policy "photos_select_own" on public.photos
  for select using (auth.uid() = owner_id);
create policy "photos_insert_own" on public.photos
  for insert with check (auth.uid() = owner_id);
create policy "photos_update_own" on public.photos
  for update using (auth.uid() = owner_id);
create policy "photos_delete_own" on public.photos
  for delete using (auth.uid() = owner_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Note: Bucket creation is handled by the setup script.
-- If running manually, create via Dashboard > Storage > New Bucket:
--   Name: item-photos
--   Public: false

-- Storage policies (run in SQL Editor)
-- These allow authenticated users to manage files in their own folder

insert into storage.buckets (id, name, public)
  values ('item-photos', 'item-photos', false)
  on conflict (id) do nothing;

create policy "storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'item-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "storage_select_own" on storage.objects
  for select using (
    bucket_id = 'item-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "storage_update_own" on storage.objects
  for update using (
    bucket_id = 'item-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

create policy "storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'item-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );
