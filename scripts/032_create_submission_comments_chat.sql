-- Chat komentar dua arah untuk pengumpulan tugas
CREATE TABLE IF NOT EXISTS public.materi_pengumpulan_komentar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.materi_pengumpulan_tugas(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materi_pengumpulan_komentar_submission
  ON public.materi_pengumpulan_komentar(submission_id, created_at);
