-- Insert simulasi data for tracking
INSERT INTO simulasi (name, title, description, slug, url, category, difficulty, is_local, created_at, updated_at) VALUES
('Membayar Bakso', 'Melengkapi Pseudocode: Membayar Bakso', 'Pelajari struktur IF-ELSE dengan simulasi pembayaran: hitung kembalian dan validasi uang', 'bayar-bakso', '/siswa/simulasi/bayar-bakso', 'Percabangan', 'easy', true, NOW(), NOW()),
('Sistem Poin Bakso Gratis', 'Sistem Poin Bakso Gratis', 'Analisis alur data dan logika poin pelanggan dengan percabangan IF-ELSE', 'poin-bakso', '/siswa/simulasi/poin-bakso', 'Percabangan', 'medium', true, NOW(), NOW()),
('Luas Tanah Pak Algor', 'Luas Tanah Pak Algor', 'Susun ekspresi aritmatika C untuk menghitung luas segitiga dengan operand dan operator yang tepat', 'luas-segitiga', '/siswa/simulasi/luas-segitiga', 'Ekspresi Aritmatika', 'easy', true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
