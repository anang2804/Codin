-- ===================================================================
-- ROLLBACK: Kembalikan ke kondisi awal (SIMPLE & PERMISSIVE)
-- ===================================================================
-- Script ini akan:
-- 1. Hapus SEMUA policies yang kompleks
-- 2. Disable RLS atau buat policies yang sangat permissive
-- 3. Biarkan aplikasi berjalan normal untuk development
-- ===================================================================

-- ============== STEP 1: HAPUS SEMUA POLICY PROFILES ==============
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Menghapus semua policies pada table profiles...';
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============== STEP 2: HAPUS SEMUA STORAGE POLICIES LEARNING-MATERIALS ==============
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Menghapus semua storage policies learning-materials...';
    FOR r IN (
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%learning-materials%'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
        RAISE NOTICE 'Dropped storage policy: %', r.policyname;
    END LOOP;
END $$;

-- ============== STEP 3: BUAT POLICIES SUPER SIMPLE (ALLOW ALL) ==============
-- PROFILES: Allow all authenticated users to do anything
CREATE POLICY "profiles_allow_all" ON public.profiles 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============== STEP 4: GRANT FULL PERMISSIONS ==============
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============== STEP 5: STORAGE POLICIES (SIMPLE) ==============
-- Allow semua authenticated users untuk upload/read/update/delete
CREATE POLICY "storage_allow_all" ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'learning-materials')
WITH CHECK (bucket_id = 'learning-materials');

-- Allow public read
CREATE POLICY "storage_public_read" ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'learning-materials');

-- ============== VERIFICATION ==============
SELECT 'Policies setelah rollback:' as info;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'objects') 
ORDER BY tablename, policyname;

-- ============== DONE ==============
SELECT '✅ ROLLBACK SELESAI! Semua policies sudah di-reset ke kondisi simple.' as status;