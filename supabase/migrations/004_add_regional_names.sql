-- Add regional name fields to games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS name_america TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS name_europe TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS regional_names_fetched BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regional_query_count INT DEFAULT 0;

-- name_america: null = same as title; 'none' = not released in America; otherwise the alternate name
-- name_europe:  null = same as title; 'none' = not released in Europe;  otherwise the alternate name
-- regional_names_fetched: FALSE = info not yet queried
-- regional_query_count: number of manual "re-query" requests made by the user
