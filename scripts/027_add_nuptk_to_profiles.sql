-- Add NUPTK column to profiles table for guru accounts
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nuptk TEXT;

COMMENT ON COLUMN public.profiles.nuptk IS 'NUPTK guru. Stored as text to preserve leading zeros, validated as digits only.';