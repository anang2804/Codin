-- Harden password storage: remove legacy plaintext values and prevent future writes.

BEGIN;

-- 1) Remove any historical plaintext password values from profiles.
UPDATE public.profiles
SET current_password = NULL
WHERE current_password IS NOT NULL;

-- 2) Ensure legacy column cannot be populated again.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_current_password_must_be_null'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_current_password_must_be_null
      CHECK (current_password IS NULL);
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.current_password IS
  'DEPRECATED. Must stay NULL. Password hash is managed by Supabase Auth.';

-- 3) Redact legacy plaintext request payloads.
UPDATE public.password_change_requests
SET requested_password = '[REDACTED]'
WHERE requested_password IS NOT NULL
  AND requested_password <> '[REDACTED]';

-- 4) Relax legacy column requirement so new flows can avoid storing passwords.
ALTER TABLE public.password_change_requests
  ALTER COLUMN requested_password DROP NOT NULL;

COMMENT ON COLUMN public.password_change_requests.requested_password IS
  'DEPRECATED. Legacy compatibility only. Do not store user passwords.';

COMMIT;
