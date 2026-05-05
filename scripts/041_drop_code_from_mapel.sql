-- Drop code column from mapel table
-- Run this migration in Supabase SQL editor

ALTER TABLE public.mapel 
DROP COLUMN IF EXISTS code;
