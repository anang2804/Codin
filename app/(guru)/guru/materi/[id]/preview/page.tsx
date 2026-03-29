import SiswaMateriDetailPage from "@/app/(siswa)/siswa/materi/[id]/page";

export default function GuruMateriPreviewPage() {
  // Reuse the siswa materi detail UI, but under the guru layout
  // so guru tetap melihat header & sidebar guru saat preview.
  return <SiswaMateriDetailPage />;
}
