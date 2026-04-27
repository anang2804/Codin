-- Tracking notifikasi komentar siswa yang belum dibaca guru
ALTER TABLE public.materi_pengumpulan_tugas
  ADD COLUMN IF NOT EXISTS komentar_terakhir_dibaca_guru_pada TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_mpt_komentar_terakhir_dibaca_guru
  ON public.materi_pengumpulan_tugas(komentar_terakhir_dibaca_guru_pada);
