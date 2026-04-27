-- Add attempt metadata columns to simulasi_progress
ALTER TABLE simulasi_progress
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_success_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS success_attempt_no INTEGER;

-- Create per-attempt history table
CREATE TABLE IF NOT EXISTS simulasi_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL,
  simulasi_id UUID NOT NULL REFERENCES simulasi(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL CHECK (attempt_no > 0),
  result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'failed')),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  UNIQUE (siswa_id, simulasi_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_simulasi_attempts_siswa
  ON simulasi_attempts(siswa_id);
CREATE INDEX IF NOT EXISTS idx_simulasi_attempts_simulasi
  ON simulasi_attempts(simulasi_id);
CREATE INDEX IF NOT EXISTS idx_simulasi_attempts_created_at
  ON simulasi_attempts(created_at DESC);

ALTER TABLE simulasi_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Siswa can read own simulasi attempts"
  ON simulasi_attempts FOR SELECT
  TO authenticated
  USING (siswa_id = auth.uid());

CREATE POLICY "Siswa can insert own simulasi attempts"
  ON simulasi_attempts FOR INSERT
  TO authenticated
  WITH CHECK (siswa_id = auth.uid());

CREATE POLICY "Guru can read all simulasi attempts"
  ON simulasi_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('guru', 'admin')
    )
  );