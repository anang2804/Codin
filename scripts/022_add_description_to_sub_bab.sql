-- Add description column to materi_sub_bab table
ALTER TABLE materi_sub_bab 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN materi_sub_bab.description IS 'Deskripsi singkat tentang sub-bab ini';
