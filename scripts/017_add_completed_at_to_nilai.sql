-- Add completed_at column to nilai table
ALTER TABLE public.nilai 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment
COMMENT ON COLUMN public.nilai.completed_at IS 'Timestamp when the assessment was completed';
