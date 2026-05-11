-- Add hash column for password metadata. Do not store plaintext passwords.
-- Final column name: password.
-- Note: profiles_guru and profiles_siswa are views; column will be inherited automatically.

DO $$
BEGIN
  -- Handle profiles table
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'current_password_hash'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'password'
  ) THEN
    ALTER TABLE public.profiles
      RENAME COLUMN current_password_hash TO password;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'password'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN password TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'password_updated_at'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN password_updated_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_password_updated_at
  ON public.profiles(password_updated_at);

COMMENT ON COLUMN public.profiles.password IS
  'bcrypt hash of the current password. Not reversible.';

COMMENT ON COLUMN public.profiles.password_updated_at IS
  'Timestamp when the password hash was last updated';