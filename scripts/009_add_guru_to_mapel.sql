-- Add guru_id column to mapel table
ALTER TABLE mapel ADD COLUMN IF NOT EXISTS guru_id UUID;

-- Add foreign key constraint
ALTER TABLE mapel 
ADD CONSTRAINT mapel_guru_id_fkey 
FOREIGN KEY (guru_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_mapel_guru_id ON mapel(guru_id);
