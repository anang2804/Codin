BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'panduan'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'panduan_pengguna'
  ) THEN
    ALTER TABLE public.panduan RENAME TO panduan_pengguna;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.panduan_pengguna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  target_role TEXT NOT NULL CHECK (target_role IN ('admin', 'guru', 'siswa')),
  file_name TEXT,
  file_url TEXT,
  file_path TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS panduan_pengguna_target_role_key
  ON public.panduan_pengguna(target_role);

CREATE INDEX IF NOT EXISTS panduan_pengguna_updated_at_idx
  ON public.panduan_pengguna(updated_at DESC);

ALTER TABLE public.panduan_pengguna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "panduan_pengguna_admin_manage" ON public.panduan_pengguna;
CREATE POLICY "panduan_pengguna_admin_manage" ON public.panduan_pengguna
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.panduan_pengguna TO authenticated;

INSERT INTO public.panduan_pengguna (title, target_role)
VALUES
  ('Panduan Admin', 'admin'),
  ('Panduan Guru', 'guru'),
  ('Panduan Siswa', 'siswa')
ON CONFLICT (target_role) DO NOTHING;

COMMIT;
