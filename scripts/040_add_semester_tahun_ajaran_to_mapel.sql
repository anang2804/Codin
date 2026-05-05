-- Add semester and tahun_ajaran columns to mapel table
-- Run this migration in Supabase SQL editor

ALTER TABLE public.mapel 
ADD COLUMN IF NOT EXISTS semester TEXT,
ADD COLUMN IF NOT EXISTS tahun_ajaran TEXT;
