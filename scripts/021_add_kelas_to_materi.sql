-- Add kelas_id column to materi table
-- This allows materi to be targeted to specific classes

ALTER TABLE materi ADD COLUMN IF NOT EXISTS kelas_id UUID;

-- Add comment
COMMENT ON COLUMN materi.kelas_id IS 'ID kelas yang dapat mengakses materi ini. NULL = semua kelas dapat akses';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_materi_kelas_id ON materi(kelas_id);
