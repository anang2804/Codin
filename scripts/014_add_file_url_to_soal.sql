-- Tambah kolom file_url ke tabel soal
-- Jalankan di Supabase SQL Editor

-- Add file_url column to soal table
ALTER TABLE public.soal 
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add comment
COMMENT ON COLUMN public.soal.file_url IS 'URL file lampiran untuk soal (gambar, PDF, dll)';

-- Verify column added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'soal' 
  AND column_name = 'file_url';
