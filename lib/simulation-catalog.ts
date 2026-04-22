export type SimulationLevel = "Dasar" | "Menengah" | "Lanjutan";

export type SimulationItem = {
  title: string;
  description: string;
  href: string;
  slug: string;
  level: SimulationLevel;
  gradient: string;
  emoji: string;
  accent: string;
};

export type SimulationSection = {
  title: string;
  badgeClass: string;
  items: SimulationItem[];
};

export const SIMULATION_SECTIONS: SimulationSection[] = [
  {
    title: "Diagram Alir",
    badgeClass: "bg-sky-50 text-sky-700 border border-sky-100",
    items: [
      {
        title: "Logika Lalu Lintas",
        description:
          "Susun diagram alir untuk mengatur lampu lalu lintas dengan benar.",
        href: "/siswa/simulasi/traffic-logic",
        slug: "traffic-logic",
        level: "Dasar",
        gradient: "from-sky-100 to-cyan-200",
        emoji: "🚦",
        accent: "border-sky-500",
      },
      {
        title: "Transisi Lampu Bertahap",
        description:
          "Susun diagram alir untuk perubahan lampu Merah ke Kuning lalu Hijau secara berurutan.",
        href: "/siswa/simulasi/traffic-debug",
        slug: "traffic-debug",
        level: "Menengah",
        gradient: "from-amber-100 to-orange-200",
        emoji: "🚦",
        accent: "border-amber-500",
      },
      {
        title: "Prioritas Tiga Kendaraan",
        description:
          "Susun diagram alir bercabang untuk sistem prioritas ambulans, lampu lalu lintas, dan kendaraan biasa.",
        href: "/siswa/simulasi/traffic-expert",
        slug: "traffic-expert",
        level: "Lanjutan",
        gradient: "from-rose-100 to-pink-200",
        emoji: "🚦",
        accent: "border-rose-500",
      },
    ],
  },
  {
    title: "Variabel Terpadu",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-100",
    items: [
      {
        title: "Mesin Kasir Kantin",
        description:
          "Amati nilai pada setiap variabel, lalu tentukan tipe data yang sesuai.",
        href: "/siswa/simulasi/kasir-kantin",
        slug: "kasir-kantin",
        level: "Dasar",
        gradient: "from-emerald-100 to-teal-200",
        emoji: "🍛",
        accent: "border-emerald-500",
      },
      {
        title: "Dashboard Speedometer",
        description:
          "Amati nilai pada setiap variabel, lalu tentukan tipe data yang sesuai.",
        href: "/siswa/simulasi/variabel-spedomater",
        slug: "variabel-spedomater",
        level: "Dasar",
        gradient: "from-emerald-100 to-cyan-200",
        emoji: "🏎️",
        accent: "border-emerald-500",
      },
      {
        title: "Tiket & Paspor Perjalanan",
        description:
          "Amati nilai pada setiap variabel, lalu tentukan tipe data yang sesuai.",
        href: "/siswa/simulasi/variabel-terpadu-dasar-travel",
        slug: "variabel-terpadu-dasar-travel",
        level: "Dasar",
        gradient: "from-teal-100 to-cyan-200",
        emoji: "🛂",
        accent: "border-teal-500",
      },
      {
        title: "Blender Jus",
        description:
          "Perhatikan data dan proses blender jus, lalu tentukan tipe data dan operator yang tepat.",
        href: "/siswa/simulasi/blender-buah",
        slug: "mesin-jus-blender",
        level: "Menengah",
        gradient: "from-lime-100 to-emerald-200",
        emoji: "🧃",
        accent: "border-lime-500",
      },
      {
        title: "Buku Rekap Nilai",
        description:
          "Amati nilai dan proses pada setiap variabel, lalu tentukan tipe data dan operator yang sesuai.",
        href: "/siswa/simulasi/variabel-rekap-nilai",
        slug: "variabel-rekap-nilai",
        level: "Menengah",
        gradient: "from-amber-100 to-orange-200",
        emoji: "🧾",
        accent: "border-amber-500",
      },
      {
        title: "Food Delivery Express",
        description:
          "Perhatikan data dan proses perhitungan ongkir, lalu tentukan tipe data dan operator yang tepat.",
        href: "/siswa/simulasi/variabel-food-delivery-menengah",
        slug: "variabel-food-delivery-menengah",
        level: "Menengah",
        gradient: "from-orange-100 to-rose-200",
        emoji: "\ud83c\udf54",
        accent: "border-orange-500",
      },
      {
        title: "Indikator Baterai Smartphone",
        description:
          "Analisis data dan proses pada sistem baterai, lalu tentukan tipe data dan operator yang sesuai.",
        href: "/siswa/simulasi/variabel-indikator-baterai-lanjutan",
        slug: "variabel-indikator-baterai-lanjutan",
        level: "Lanjutan",
        gradient: "from-lime-100 to-emerald-200",
        emoji: "🔋",
        accent: "border-lime-500",
      },
      {
        title: "Indikator Bensin Digital",
        description:
          "Amati data dan kondisi bahan bakar, lalu tentukan tipe data dan operator yang tepat.",
        href: "/siswa/simulasi/variabel-indikator-bensin-digital-lanjutan",
        slug: "variabel-indikator-bensin-digital-lanjutan",
        level: "Lanjutan",
        gradient: "from-amber-100 to-orange-200",
        emoji: "⛽",
        accent: "border-amber-500",
      },
    ],
  },
  {
    title: "Struktur Kontrol",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    items: [
      {
        title: "Percabangan: Lampu Tidur Otomatis",
        description:
          "Lengkapi struktur kontrol dasar untuk menyalakan lampu tidur saat sensor cahaya berada di bawah batas gelap.",
        href: "/siswa/simulasi/struktur-kontrol-lampu-tidur-dasar",
        slug: "struktur-kontrol-lampu-tidur-dasar",
        level: "Dasar",
        gradient: "from-emerald-100 to-lime-200",
        emoji: "💡",
        accent: "border-emerald-500",
      },
      {
        title: "Perulangan: Kirim Pesan Massal",
        description:
          "Lengkapi perulangan untuk mengirim pesan berulang ke beberapa penerima hingga selesai.",
        href: "/siswa/simulasi/struktur-kontrol-kirim-pesan-massal-dasar",
        slug: "struktur-kontrol-kirim-pesan-massal-dasar",
        level: "Dasar",
        gradient: "from-cyan-100 to-sky-200",
        emoji: "📨",
        accent: "border-cyan-500",
      },
      {
        title: "Perulangan: Pengisian Galon Air ",
        description:
          "Lengkapi perulangan untuk mengisi galon air bertahap sampai kapasitas maksimal.",
        href: "/siswa/simulasi/struktur-kontrol-pengisian-galon-air-dasar",
        slug: "struktur-kontrol-pengisian-galon-air-dasar",
        level: "Dasar",
        gradient: "from-cyan-100 to-emerald-200",
        emoji: "💧",
        accent: "border-cyan-500",
      },
      {
        title: "Perulangan: Penyeberangan Jalan ",
        description:
          "Lengkapi perulanganagar pejalan kaki menunggu lampu hijau sebelum menyeberang.",
        href: "/siswa/simulasi/struktur-kontrol-penyeberangan-jalan-dasar",
        slug: "struktur-kontrol-penyeberangan-jalan-dasar",
        level: "Dasar",
        gradient: "from-emerald-100 to-teal-200",
        emoji: "🚦",
        accent: "border-emerald-500",
      },
      {
        title: "Perulangan & Percabangan: Pemilah Sampah",
        description:
          "Lengkapi for-if-else untuk memilah daun, botol, dan kaleng ke tong yang sesuai.",
        href: "/siswa/simulasi/struktur-kontrol-pemilah-sampah-menengah",
        slug: "struktur-kontrol-pemilah-sampah-menengah",
        level: "Menengah",
        gradient: "from-lime-100 to-emerald-200",
        emoji: "♻️",
        accent: "border-lime-500",
      },
      {
        title: "Pintu Otomatis Cerdas",
        description:
          "Lengkapi struktur kontrol lanjutan untuk membaca sensor jarak, membuka pintu saat orang mendekat, dan menutupnya saat area kosong.",
        href: "/siswa/simulasi/struktur-kontrol-pintu-otomatis-lanjutan",
        slug: "struktur-kontrol-pintu-otomatis-lanjutan",
        level: "Lanjutan",
        gradient: "from-indigo-100 to-sky-200",
        emoji: "🚪",
        accent: "border-indigo-500",
      },
    ],
  },
];

export const SIMULATION_SLUGS = SIMULATION_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.slug),
);

export const SIMULATION_TOTAL = SIMULATION_SLUGS.length;
