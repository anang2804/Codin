-- Fix RLS policies for jawaban_siswa table

-- Enable RLS
ALTER TABLE public.jawaban_siswa ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "jawaban_siswa_select_own" ON public.jawaban_siswa;
DROP POLICY IF EXISTS "jawaban_siswa_insert_own" ON public.jawaban_siswa;
DROP POLICY IF EXISTS "jawaban_siswa_delete_own" ON public.jawaban_siswa;
DROP POLICY IF EXISTS "jawaban_siswa_guru_delete" ON public.jawaban_siswa;

-- Allow users to view their own jawaban
CREATE POLICY "jawaban_siswa_select_own" ON public.jawaban_siswa
  FOR SELECT
  TO authenticated
  USING (siswa_id = auth.uid());

-- Allow users to insert their own jawaban
CREATE POLICY "jawaban_siswa_insert_own" ON public.jawaban_siswa
  FOR INSERT
  TO authenticated
  WITH CHECK (siswa_id = auth.uid());

-- Allow users to delete their own jawaban
CREATE POLICY "jawaban_siswa_delete_own" ON public.jawaban_siswa
  FOR DELETE
  TO authenticated
  USING (siswa_id = auth.uid());

-- Allow guru to delete jawaban for reset functionality
CREATE POLICY "jawaban_siswa_guru_delete" ON public.jawaban_siswa
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guru'
    )
  );

-- Allow guru to select all jawaban
CREATE POLICY "jawaban_siswa_guru_select" ON public.jawaban_siswa
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guru'
    )
  );
