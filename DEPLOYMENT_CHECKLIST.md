# Checklist Agar Database Tidak Error

## 1. Supabase Project Settings

- ✅ Pastikan project tidak di-pause (free tier pause setelah 7 hari inaktif)
- ✅ Buka dashboard minimal 1x seminggu: https://supabase.com/dashboard/project/ijadiwgikyjanawzjlsr
- ✅ Pertimbangkan upgrade ke Pro plan ($25/bulan) untuk production

## 2. Connection String Best Practices

- ✅ Gunakan **Supabase Pooler** (aws-1-us-east-1.pooler.supabase.com)
- ✅ Gunakan **Session Mode** (port 5432) bukan Transaction Mode (port 6543)
- ✅ Set `pgbouncer=true` parameter
- ✅ Set `connect_timeout=10` untuk avoid hanging

## 3. Prisma Client Configuration

- ✅ Enable connection retry mechanism (sudah diimplementasi)
- ✅ Connection pooling dengan proper limits
- ✅ Graceful error handling

## 4. Development Best Practices

- ✅ Restart dev server jika idle > 1 jam
- ✅ Jangan biarkan multiple Prisma instance running
- ✅ Kill zombie node processes: `taskkill //F //IM node.exe`

## 5. Monitoring

- ✅ Check Supabase Dashboard untuk database health
- ✅ Monitor API response times
- ✅ Check logs untuk connection errors

## 6. Production Deployment

- ✅ Gunakan environment variables yang berbeda
- ✅ Set proper connection limits based on hosting platform
- ✅ Enable database backup
- ✅ Setup monitoring (Sentry, LogRocket, etc.)

## Quick Fix Jika Error

```bash
# 1. Kill all node processes
taskkill //F //IM node.exe

# 2. Clear Prisma cache
npx prisma generate

# 3. Restart dev server
npm run dev
```

## Environment Variables Template

```env
# Session Mode Pooler - Most Stable
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=10"
DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

## 7. Multi-Role Login Paralel (Admin/Guru/Siswa)

- ✅ Gunakan subdomain terpisah per role agar sesi tidak saling menimpa
- ✅ Tambahkan domain berikut di project Vercel:
  - `admin.your-domain.com`
  - `guru.your-domain.com`
  - `siswa.your-domain.com`
- ✅ Arahkan semua subdomain ke deployment app yang sama
- ✅ Set environment variable di Vercel (Production + Preview):
  - `NEXT_PUBLIC_ADMIN_HOST=admin.your-domain.com`
  - `NEXT_PUBLIC_GURU_HOST=guru.your-domain.com`
  - `NEXT_PUBLIC_SISWA_HOST=siswa.your-domain.com`
- ✅ Redeploy setelah env variable diubah

Contoh alur pakai:

1. Login admin di `https://admin.your-domain.com/auth/login`
2. Login siswa di `https://siswa.your-domain.com/auth/login`
3. Keduanya bisa aktif bersamaan dalam browser/profile yang sama
