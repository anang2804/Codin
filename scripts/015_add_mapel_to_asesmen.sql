-- Add mapel_id column to asesmen table
ALTER TABLE public.asesmen 
ADD COLUMN IF NOT EXISTS mapel_id UUID REFERENCES public.mapel(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_asesmen_mapel_id ON public.asesmen(mapel_id);
CREATE INDEX IF NOT EXISTS idx_asesmen_kelas_id ON public.asesmen(kelas_id);
