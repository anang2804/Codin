-- Add RLS policies for nilai table

-- Enable RLS
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "nilai_select_own" ON public.nilai;
DROP POLICY IF EXISTS "nilai_insert_own" ON public.nilai;
DROP POLICY IF EXISTS "nilai_update_own" ON public.nilai;

-- Allow users to view their own nilai
CREATE POLICY "nilai_select_own" ON public.nilai
  FOR SELECT
  TO authenticated
  USING (siswa_id = auth.uid());

-- Allow users to insert their own nilai
CREATE POLICY "nilai_insert_own" ON public.nilai
  FOR INSERT
  TO authenticated
  WITH CHECK (siswa_id = auth.uid());

-- Allow users to update their own nilai (for corrections)
CREATE POLICY "nilai_update_own" ON public.nilai
  FOR UPDATE
  TO authenticated
  USING (siswa_id = auth.uid())
  WITH CHECK (siswa_id = auth.uid());

-- Allow guru to view all nilai
CREATE POLICY "nilai_guru_select_all" ON public.nilai
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'guru'
    )
  );
