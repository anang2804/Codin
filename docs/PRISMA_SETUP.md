# Setup Prisma untuk Smart Learning Platform

## 📋 Setup Awal

### 1. Install Dependencies (Sudah Dilakukan)

```bash
npm install prisma @prisma/client
```

### 2. Konfigurasi Database URL

Buka file `.env.local` dan ganti `[YOUR-PASSWORD]` dengan password database Supabase Anda:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.ijadiwgikyjanawzjlsr.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.ijadiwgikyjanawzjlsr.supabase.co:5432/postgres"
```

**Cara mendapatkan password database:**

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project: ijadiwgikyjanawzjlsr
3. Settings → Database → Connection string
4. Lihat password atau reset jika lupa

### 3. Pull Schema dari Database (Opsional)

Jika ingin sinkronisasi dengan database yang sudah ada:

```bash
npx prisma db pull
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Jalankan Migrasi (Jika perlu)

```bash
npx prisma migrate dev --name init
```

## 🚀 Cara Menggunakan Prisma

### Import Prisma Client

```typescript
import prisma from "@/lib/prisma";
```

### Contoh CRUD Operations

#### 1. **CREATE** - Tambah Data Materi

```typescript
// Menggunakan Supabase (cara lama)
const { data, error } = await supabase.from("materi").insert({
  title: "Materi Baru",
  description: "Deskripsi",
  mapel_id: "uuid",
  created_by: user.id,
});

// Menggunakan Prisma (cara baru) ✅
const materi = await prisma.materi.create({
  data: {
    title: "Materi Baru",
    description: "Deskripsi",
    mapel_id: "uuid",
    created_by: user.id,
  },
});
```

#### 2. **READ** - Ambil Data dengan Relasi

```typescript
// Menggunakan Supabase (cara lama)
const { data } = await supabase
  .from("materi")
  .select(
    `
    *,
    mapel:mapel_id (
      id,
      name
    )
  `
  )
  .eq("created_by", user.id);

// Menggunakan Prisma (cara baru) ✅
const materi = await prisma.materi.findMany({
  where: {
    created_by: user.id,
  },
  include: {
    mapel: true,
    creator: {
      select: {
        full_name: true,
        email: true,
      },
    },
    babs: {
      include: {
        sub_babs: true,
      },
    },
  },
  orderBy: {
    created_at: "desc",
  },
});
```

#### 3. **UPDATE** - Update Data

```typescript
// Menggunakan Supabase (cara lama)
const { error } = await supabase
  .from("materi")
  .update({ title: "Judul Baru" })
  .eq("id", materiId);

// Menggunakan Prisma (cara baru) ✅
const updatedMateri = await prisma.materi.update({
  where: { id: materiId },
  data: { title: "Judul Baru" },
});
```

#### 4. **DELETE** - Hapus Data

```typescript
// Menggunakan Supabase (cara lama)
const { error } = await supabase.from("materi").delete().eq("id", materiId);

// Menggunakan Prisma (cara baru) ✅
await prisma.materi.delete({
  where: { id: materiId },
});
```

## 📝 Contoh Lengkap: Refactor Halaman Materi Guru

### Before (Supabase):

```typescript
const fetchData = async () => {
  const { data: materiData } = await supabase
    .from("materi")
    .select(
      `
      *,
      mapel:mapel_id (id, name)
    `
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  setMateri(materiData || []);
};
```

### After (Prisma):

```typescript
const fetchData = async () => {
  const materiData = await prisma.materi.findMany({
    where: { created_by: user.id },
    include: {
      mapel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  setMateri(materiData);
};
```

## 🎯 Keuntungan Menggunakan Prisma

1. **Type Safety** - Auto-complete dan error checking
2. **Relasi Mudah** - Include relations dengan mudah
3. **Migration** - Track perubahan database
4. **Query Builder** - Lebih readable dan maintainable
5. **Performance** - Optimized queries
6. **Error Handling** - Better error messages

## 📚 Query Examples

### Complex Query dengan Multiple Relations

```typescript
// Ambil materi dengan semua relasi
const materiDetail = await prisma.materi.findUnique({
  where: { id: materiId },
  include: {
    mapel: true,
    creator: {
      select: {
        full_name: true,
        email: true,
      },
    },
    babs: {
      orderBy: { order_index: "asc" },
      include: {
        sub_babs: {
          orderBy: { order_index: "asc" },
        },
      },
    },
    progress: {
      include: {
        siswa: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    },
  },
});
```

### Filtering & Searching

```typescript
// Search materi by title or description
const results = await prisma.materi.findMany({
  where: {
    OR: [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ],
    AND: {
      created_by: user.id,
      mapel_id: selectedMapelId || undefined,
    },
  },
});
```

### Aggregation & Counting

```typescript
// Count materi per mapel
const stats = await prisma.materi.groupBy({
  by: ["mapel_id"],
  _count: {
    id: true,
  },
  where: {
    created_by: user.id,
  },
});
```

### Transaction (Multiple Operations)

```typescript
// Create materi dengan bab dan sub-bab sekaligus
const result = await prisma.$transaction(async (tx) => {
  const materi = await tx.materi.create({
    data: {
      title: "Materi Baru",
      created_by: user.id,
    },
  });

  const bab = await tx.materiBab.create({
    data: {
      materi_id: materi.id,
      title: "Bab 1",
      order_index: 0,
    },
  });

  const subBab = await tx.materiSubBab.create({
    data: {
      bab_id: bab.id,
      title: "Sub Bab 1.1",
      content_type: "text",
      content: "Konten...",
      order_index: 0,
    },
  });

  return { materi, bab, subBab };
});
```

## 🔄 Migration dari Supabase ke Prisma

Tidak perlu menghapus kode Supabase yang sudah ada. Anda bisa:

1. **Hybrid Approach** - Gunakan Prisma untuk fitur baru, keep Supabase untuk yang lama
2. **Gradual Migration** - Refactor sedikit demi sedikit
3. **Full Migration** - Refactor semua sekaligus (butuh waktu)

## 📖 Resources

- Prisma Docs: https://www.prisma.io/docs
- Prisma with Next.js: https://www.prisma.io/docs/guides/other/next-js
- Prisma with Supabase: https://www.prisma.io/docs/guides/deployment/supabase

## ⚠️ Important Notes

1. Prisma menggunakan connection pooling, cocok untuk serverless
2. Untuk API Routes, gunakan Prisma
3. Untuk Client Components, tetap bisa pakai Supabase Client
4. RLS (Row Level Security) Supabase masih aktif, tapi harus di-handle manual di Prisma
