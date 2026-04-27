-- Tambahkan kolom penilaian tugas oleh guru
ALTER TABLE public.materi_pengumpulan_tugas
  ADD COLUMN IF NOT EXISTS nilai_tugas INT,
  ADD COLUMN IF NOT EXISTS komentar_guru TEXT;

-- Batasi rentang nilai 0-100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'materi_pengumpulan_tugas_nilai_tugas_check'
  ) THEN
    ALTER TABLE public.materi_pengumpulan_tugas
      ADD CONSTRAINT materi_pengumpulan_tugas_nilai_tugas_check
      CHECK (nilai_tugas IS NULL OR (nilai_tugas >= 0 AND nilai_tugas <= 100));
  END IF;
END $$;
