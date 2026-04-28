-- Ensure guru can UPDATE and DELETE their own asesmen rows
-- Run this in Supabase SQL Editor for existing projects

BEGIN;

-- Make sure RLS is enabled
ALTER TABLE public.asesmen ENABLE ROW LEVEL SECURITY;

-- Recreate UPDATE policy (idempotent)
DROP POLICY IF EXISTS "asesmen_update_own" ON public.asesmen;
CREATE POLICY "asesmen_update_own" ON public.asesmen
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Recreate DELETE policy (idempotent)
DROP POLICY IF EXISTS "asesmen_delete_own" ON public.asesmen;
CREATE POLICY "asesmen_delete_own" ON public.asesmen
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Required table privileges for authenticated users
GRANT UPDATE, DELETE ON public.asesmen TO authenticated;

COMMIT;

-- Optional verify:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'asesmen'
-- ORDER BY cmd, policyname;
