-- Tabel pengumpulan tugas siswa per sub-bab materi
CREATE TABLE IF NOT EXISTS public.materi_pengumpulan_tugas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_bab_id UUID NOT NULL REFERENCES public.materi_sub_bab(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url_file TEXT NOT NULL,
  nama_file TEXT NOT NULL,
  ukuran_file BIGINT NOT NULL DEFAULT 0,
  tipe_mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  dikumpulkan_pada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diperbarui_pada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sub_bab_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_materi_pengumpulan_tugas_sub_bab
  ON public.materi_pengumpulan_tugas(sub_bab_id);

CREATE INDEX IF NOT EXISTS idx_materi_pengumpulan_tugas_siswa
  ON public.materi_pengumpulan_tugas(siswa_id);

ALTER TABLE public.materi_pengumpulan_tugas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "siswa_bisa_lihat_pengumpulan_tugas_sendiri"
  ON public.materi_pengumpulan_tugas
  FOR SELECT
  USING (auth.uid() = siswa_id);

CREATE POLICY "siswa_bisa_tambah_pengumpulan_tugas_sendiri"
  ON public.materi_pengumpulan_tugas
  FOR INSERT
  WITH CHECK (auth.uid() = siswa_id);

CREATE POLICY "siswa_bisa_ubah_pengumpulan_tugas_sendiri"
  ON public.materi_pengumpulan_tugas
  FOR UPDATE
  USING (auth.uid() = siswa_id)
  WITH CHECK (auth.uid() = siswa_id);
