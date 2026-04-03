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
    title: "Struktur Program (IPO)",
    badgeClass: "bg-violet-50 text-violet-700 border border-violet-100",
    items: [
      {
        title: "Perbaiki Mesin Kasir Kantin",
        description:
          "Susun struktur Input-Process-Output untuk proses perhitungan total belanja di kasir kantin.",
        href: "/siswa/simulasi/kasir-kantin",
        slug: "kasir-kantin",
        level: "Dasar",
        gradient: "from-emerald-100 to-teal-200",
        emoji: "🍛",
        accent: "border-emerald-500",
      },
      {
        title: "Blender Jus",
        description:
          "Susun struktur Input-Process-Output untuk proses blender dari buah menjadi jus.",
        href: "/siswa/simulasi/blender-buah",
        slug: "mesin-jus-blender",
        level: "Menengah",
        gradient: "from-lime-100 to-emerald-200",
        emoji: "🧃",
        accent: "border-lime-500",
      },
      {
        title: "Mesin Cuci Otomatis",
        description:
          "Lengkapi struktur Input-Process-Output mesin cuci hingga menghasilkan pakaian_bersih.",
        href: "/siswa/simulasi/mesin-cuci",
        slug: "mesin-cuci-lanjutan",
        level: "Lanjutan",
        gradient: "from-violet-100 to-indigo-200",
        emoji: "🧺",
        accent: "border-violet-500",
      },
    ],
  },
  {
    title: "Variabel Terpadu",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-100",
    items: [
      {
        title: "Dasar: Tipe Data Variabel",
        description:
          "Pelajari relasi tipe data, variabel, dan operator penugasan (=) dengan int, float, char, dan boolean.",
        href: "/siswa/simulasi/variabel-terpadu-dasar",
        slug: "variabel-terpadu-dasar",
        level: "Dasar",
        gradient: "from-emerald-100 to-lime-200",
        emoji: "🎓",
        accent: "border-emerald-500",
      },
      {
        title: "Menengah: Ekspresi Aritmatika",
        description:
          "Gunakan variabel dengan operator aritmatika (+, -, *, /) dan pembanding dasar untuk menentukan hasil.",
        href: "/siswa/simulasi/variabel-terpadu-menengah",
        slug: "variabel-terpadu-menengah",
        level: "Menengah",
        gradient: "from-cyan-100 to-sky-200",
        emoji: "🔢",
        accent: "border-cyan-500",
      },
      {
        title: "Lanjutan: Logika Keputusan",
        description:
          "Gabungkan variabel, aritmatika, operator pembanding, dan boolean logic untuk menghasilkan keputusan akhir.",
        href: "/siswa/simulasi/variabel-terpadu-lanjutan",
        slug: "variabel-terpadu-lanjutan",
        level: "Lanjutan",
        gradient: "from-violet-100 to-indigo-200",
        emoji: "🧠",
        accent: "border-violet-500",
      },
      {
        title: "Dashboard Speedometer",
        description:
          "Susun tipe data variabel yang tepat menggunakan int, float, char, dan boolean.",
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
          "Susun tipe data variabel yang tepat menggunakan string, char, int, float, dan boolean.",
        href: "/siswa/simulasi/variabel-terpadu-dasar-travel",
        slug: "variabel-terpadu-dasar-travel",
        level: "Dasar",
        gradient: "from-teal-100 to-cyan-200",
        emoji: "🛂",
        accent: "border-teal-500",
      },
      {
        title: "Buku Rekap Nilai",
        description:
          "Lengkapi tipe data dan ekspresi pada rekap nilai siswa untuk menghitung total, rata-rata, dan menentukan status kelulusan.",
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
          "Lengkapi tipe data dan ekspresi pada aplikasi pesan antar makanan untuk menghitung total ongkir dan status gratis ongkir.",
        href: "/siswa/simulasi/variabel-food-delivery-menengah",
        slug: "variabel-food-delivery-menengah",
        level: "Menengah",
        gradient: "from-orange-100 to-rose-200",
        emoji: "\ud83c\udf54",
        accent: "border-orange-500",
      },
      {
        title: "Lanjutan (Varian): Smart Class",
        description:
          "Variasi visual level lanjutan untuk melatih keputusan berbasis operator pembanding dan boolean logic.",
        href: "/siswa/simulasi/variabel-terpadu-lanjutan-smartclass",
        slug: "variabel-terpadu-lanjutan-smartclass",
        level: "Lanjutan",
        gradient: "from-fuchsia-100 to-pink-200",
        emoji: "🏫",
        accent: "border-fuchsia-500",
      },
      {
        title: "Indikator Baterai Smartphone",
        description:
          "Lengkapi tipe data, ekspresi, dan pembanding untuk menghitung sisa daya baterai dan status pengisian selesai.",
        href: "/siswa/simulasi/variabel-indikator-baterai-lanjutan",
        slug: "variabel-indikator-baterai-lanjutan",
        level: "Lanjutan",
        gradient: "from-lime-100 to-emerald-200",
        emoji: "🔋",
        accent: "border-lime-500",
      },
    ],
  },
  {
    title: "Pseudocode",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    items: [
      {
        title: "Login HP",
        description:
          "Lengkapi pseudocode login HP untuk memeriksa PIN dengan struktur IF-ELSE.",
        href: "/siswa/simulasi/login-hp",
        slug: "login-hp",
        level: "Dasar",
        gradient: "from-teal-100 to-emerald-200",
        emoji: "📱",
        accent: "border-teal-500",
      },
      {
        title: "Koneksi Sensor & Pintu",
        description:
          "Lengkapi pseudocode pintu otomatis agar bekerja sesuai deteksi sensor infrared.",
        href: "/siswa/simulasi/pintu-otomatis",
        slug: "pintu-otomatis",
        level: "Menengah",
        gradient: "from-indigo-100 to-purple-200",
        emoji: "🚪",
        accent: "border-indigo-500",
      },
      {
        title: "Sistem Parkir Otomatis",
        description:
          "Lengkapi pseudocode sistem parkir dengan sensor dan kondisi IF-ELSE untuk akses kendaraan.",
        href: "/siswa/simulasi/parkir-otomatis",
        slug: "parkir-otomatis",
        level: "Lanjutan",
        gradient: "from-blue-100 to-cyan-200",
        emoji: "🚗",
        accent: "border-blue-500",
      },
      {
        title: "Kipas Angin Otomatis",
        description:
          "Lengkapi pseudocode kontrol kipas berdasarkan suhu ruangan dengan struktur IF-ELSE.",
        href: "/siswa/simulasi/kipas-angin",
        slug: "kipas-angin",
        level: "Lanjutan",
        gradient: "from-cyan-100 to-sky-200",
        emoji: "🌀",
        accent: "border-cyan-500",
      },
      {
        title: "Beli di Kasir",
        description:
          "Lengkapi pseudocode kasir untuk menghitung total belanja dari harga_barang dan jumlah_barang.",
        href: "/siswa/simulasi/beli-di-kasir",
        slug: "beli-di-kasir",
        level: "Dasar",
        gradient: "from-emerald-100 to-lime-200",
        emoji: "🛒",
        accent: "border-emerald-500",
      },
    ],
  },
];

export const SIMULATION_SLUGS = SIMULATION_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.slug),
);

export const SIMULATION_TOTAL = SIMULATION_SLUGS.length;
