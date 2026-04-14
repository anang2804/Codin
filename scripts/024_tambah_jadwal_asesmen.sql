-- Tambah kolom jadwal kuis untuk asesmen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asesmen'
      AND column_name = 'start_at'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asesmen'
      AND column_name = 'waktu_mulai'
  ) THEN
    ALTER TABLE public.asesmen RENAME COLUMN start_at TO waktu_mulai;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asesmen'
      AND column_name = 'end_at'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asesmen'
      AND column_name = 'waktu_selesai'
  ) THEN
    ALTER TABLE public.asesmen RENAME COLUMN end_at TO waktu_selesai;
  END IF;
END $$;

ALTER TABLE public.asesmen
ADD COLUMN IF NOT EXISTS waktu_mulai timestamptz,
ADD COLUMN IF NOT EXISTS waktu_selesai timestamptz;

-- Pastikan waktu selesai setelah waktu mulai jika keduanya diisi
DO $$
BEGIN
  ALTER TABLE public.asesmen
  DROP CONSTRAINT IF EXISTS asesmen_schedule_window_check;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'asesmen_jadwal_waktu_check'
  ) THEN
    ALTER TABLE public.asesmen
    ADD CONSTRAINT asesmen_jadwal_waktu_check
    CHECK (
      waktu_mulai IS NULL
      OR waktu_selesai IS NULL
      OR waktu_selesai > waktu_mulai
    );
  END IF;
END $$;
