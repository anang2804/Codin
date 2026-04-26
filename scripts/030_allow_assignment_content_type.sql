-- Allow assignment as a valid content_type in materi_sub_bab
ALTER TABLE public.materi_sub_bab
  DROP CONSTRAINT IF EXISTS materi_sub_bab_content_type_check;

ALTER TABLE public.materi_sub_bab
  ADD CONSTRAINT materi_sub_bab_content_type_check
  CHECK (content_type IN ('text', 'video', 'file', 'link', 'assignment'));
