-- Create simulasi table
CREATE TABLE IF NOT EXISTS simulasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  category VARCHAR(100),
  description TEXT,
  thumbnail TEXT,
  url TEXT,
  slug VARCHAR(255) UNIQUE,
  tags JSONB,
  difficulty VARCHAR(50) DEFAULT 'medium',
  is_local BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  stage INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Create simulasi_progress table
CREATE TABLE IF NOT EXISTS simulasi_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL,
  simulasi_id UUID NOT NULL REFERENCES simulasi(id) ON DELETE CASCADE,
  current_stage INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ(6),
  last_accessed TIMESTAMPTZ(6) DEFAULT NOW(),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  UNIQUE(siswa_id, simulasi_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_simulasi_slug ON simulasi(slug);
CREATE INDEX IF NOT EXISTS idx_simulasi_progress_siswa ON simulasi_progress(siswa_id);
CREATE INDEX IF NOT EXISTS idx_simulasi_progress_simulasi ON simulasi_progress(simulasi_id);

-- Enable RLS
ALTER TABLE simulasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulasi_progress ENABLE ROW LEVEL SECURITY;

-- Policies for simulasi (everyone can read)
CREATE POLICY "Allow all to read simulasi"
  ON simulasi FOR SELECT
  TO authenticated
  USING (true);

-- Policies for simulasi_progress
CREATE POLICY "Siswa can read own progress"
  ON simulasi_progress FOR SELECT
  TO authenticated
  USING (siswa_id = auth.uid());

CREATE POLICY "Siswa can insert own progress"
  ON simulasi_progress FOR INSERT
  TO authenticated
  WITH CHECK (siswa_id = auth.uid());

CREATE POLICY "Siswa can update own progress"
  ON simulasi_progress FOR UPDATE
  TO authenticated
  USING (siswa_id = auth.uid());

CREATE POLICY "Guru can read all progress"
  ON simulasi_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('guru', 'admin')
    )
  );
