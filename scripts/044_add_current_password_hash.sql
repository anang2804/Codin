-- Add hash column for password metadata. Do not store plaintext passwords.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_password_updated_at
  ON public.profiles(password_updated_at);

COMMENT ON COLUMN public.profiles.current_password_hash IS
  'bcrypt hash of the current password. Not reversible.';

COMMENT ON COLUMN public.profiles.password_updated_at IS
  'Timestamp when the password hash was last updated';