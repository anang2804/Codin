-- Recreate the guru profiles view so it exposes the latest columns from public.profiles.
-- This ensures nuptk is available in profiles_guru as well.
CREATE OR REPLACE VIEW public.profiles_guru AS
SELECT
  *
FROM public.profiles
WHERE role = 'guru';