-- Fix RLS policies untuk asesmen dan soal
-- Jalankan di Supabase SQL Editor

-- ============== ASESMEN POLICIES ==============
-- Drop existing policies
DROP POLICY IF EXISTS "asesmen_delete_own" ON public.asesmen;
DROP POLICY IF EXISTS "asesmen_update_own" ON public.asesmen;

-- Create policies
CREATE POLICY "asesmen_delete_own" ON public.asesmen 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "asesmen_update_own" ON public.asesmen 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid());

-- ============== SOAL POLICIES ==============
-- Drop existing policies
DROP POLICY IF EXISTS "soal_insert_own" ON public.soal;
DROP POLICY IF EXISTS "soal_update_own" ON public.soal;
DROP POLICY IF EXISTS "soal_delete_own" ON public.soal;

-- Create INSERT policy: guru can add soals to their asesmen
CREATE POLICY "soal_insert_own" ON public.soal 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asesmen 
    WHERE id = asesmen_id AND created_by = auth.uid()
  )
);

-- Create UPDATE policy: guru can update soals from their asesmen
CREATE POLICY "soal_update_own" ON public.soal 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.asesmen 
    WHERE id = soal.asesmen_id AND created_by = auth.uid()
  )
);

-- Create DELETE policy: guru can delete soals from their asesmen
CREATE POLICY "soal_delete_own" ON public.soal 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.asesmen 
    WHERE id = soal.asesmen_id AND created_by = auth.uid()
  )
);

-- Grant permissions
GRANT DELETE, UPDATE ON public.asesmen TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soal TO authenticated;

-- Verify policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('asesmen', 'soal')
ORDER BY tablename, cmd;

