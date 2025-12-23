-- Add duration column to asesmen table (in minutes)
ALTER TABLE public.asesmen 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- Add comment
COMMENT ON COLUMN public.asesmen.duration IS 'Duration in minutes for completing the assessment';
