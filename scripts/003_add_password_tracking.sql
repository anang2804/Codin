-- Legacy script: keep only password update metadata, never store plaintext password.
-- If `current_password` exists from older deployments, keep it NULL and migrate away.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_password TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_password_updated_at ON profiles(password_updated_at);

-- Comment on columns
COMMENT ON COLUMN profiles.current_password IS 'DEPRECATED. Do not store plaintext password.';
COMMENT ON COLUMN profiles.password_updated_at IS 'Timestamp when password was last updated';
