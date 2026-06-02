-- Fix RLS policy untuk siswa menggunakan kelas_id dan kelas.name
DROP POLICY IF EXISTS "Siswa can view all materi" ON public.materi;
DROP POLICY IF EXISTS "Siswa can view materi for their class" ON public.materi;
DROP POLICY IF EXISTS "Siswa can view materi" ON public.materi;

CREATE POLICY "Siswa can view materi"
  ON public.materi
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'siswa'
        AND (
          -- Jika kelas_id NULL, semua siswa bisa akses
          materi.kelas_id IS NULL
          -- Atau kelas siswa sama dengan nama kelas di materi
          OR (
            materi.kelas_id IS NOT NULL
            AND profiles.kelas = (
              SELECT name FROM public.kelas WHERE id = materi.kelas_id LIMIT 1
            )
          )
        )
    )
  );
