-- ============================================
-- Migration 003: Replace external services with ChatGPT
-- ============================================
-- Run this in Supabase SQL Editor

-- Drop igdb_id column (no longer needed)
ALTER TABLE public.games DROP COLUMN IF EXISTS igdb_id;

-- Update source constraint: only CHATGPT and MANUAL
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_source_check;
ALTER TABLE public.games ADD CONSTRAINT games_source_check
  CHECK (source IN ('CHATGPT', 'MANUAL'));

-- Update existing rows if any
UPDATE public.games SET source = 'CHATGPT' WHERE source IN ('IGDB', 'MOBYGAMES');

-- Drop the old unique index on igdb_id (no longer exists)
DROP INDEX IF EXISTS idx_games_owner_igdb;
