-- ============================================
-- Migration 002: Add MOBYGAMES as game source
-- ============================================
-- Run this in Supabase SQL Editor AFTER 001_initial.sql

-- Update the source check constraint to allow MOBYGAMES
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_source_check;
ALTER TABLE public.games ADD CONSTRAINT games_source_check
  CHECK (source IN ('IGDB', 'MANUAL', 'MOBYGAMES'));
