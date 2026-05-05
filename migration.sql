-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL,
    "kelas" TEXT,
    "nuptk" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mapel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "guru_id" UUID,
    "semester" TEXT,
    "tahun_ajaran" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "wali_kelas_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "kelas_id" UUID,
    "mapel_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi_bab" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "materi_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materi_bab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi_sub_bab" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bab_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "content_type" VARCHAR(20) NOT NULL,
    "content_url" TEXT,
    "duration" INTEGER DEFAULT 0,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materi_sub_bab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi_pendukung" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "materi_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "file_type" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materi_pendukung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "siswa_id" UUID NOT NULL,
    "materi_id" UUID NOT NULL,
    "completed_sub_bab" INTEGER NOT NULL DEFAULT 0,
    "total_sub_bab" INTEGER NOT NULL DEFAULT 0,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "last_read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materi_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_bab_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "siswa_id" UUID NOT NULL,
    "sub_bab_id" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_bab_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulasi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "url" TEXT NOT NULL,
    "tags" JSONB,
    "difficulty" TEXT NOT NULL,
    "is_local" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "stage" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulasi_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "siswa_id" UUID NOT NULL,
    "simulasi_id" UUID NOT NULL,
    "current_stage" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "first_success_at" TIMESTAMPTZ(6),
    "success_attempt_no" INTEGER,
    "last_accessed" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulasi_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulasi_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "siswa_id" UUID NOT NULL,
    "simulasi_id" UUID NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulasi_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asesmen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kelas_id" UUID,
    "mapel_id" UUID,
    "created_by" UUID NOT NULL,
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "waktu_mulai" TIMESTAMPTZ(6),
    "waktu_selesai" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asesmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesmen_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_siswa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesmen_id" UUID NOT NULL,
    "siswa_id" UUID NOT NULL,
    "soal_id" UUID NOT NULL,
    "answer" TEXT,
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jawaban_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesmen_id" UUID NOT NULL,
    "siswa_id" UUID NOT NULL,
    "score" INTEGER,
    "status" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nilai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mapel_code_key" ON "mapel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_name_key" ON "kelas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "materi_progress_siswa_id_materi_id_key" ON "materi_progress"("siswa_id", "materi_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_bab_progress_siswa_id_sub_bab_id_key" ON "sub_bab_progress"("siswa_id", "sub_bab_id");

-- CreateIndex
CREATE UNIQUE INDEX "simulasi_progress_siswa_id_simulasi_id_key" ON "simulasi_progress"("siswa_id", "simulasi_id");

-- CreateIndex
CREATE UNIQUE INDEX "simulasi_attempts_siswa_id_simulasi_id_attempt_no_key" ON "simulasi_attempts"("siswa_id", "simulasi_id", "attempt_no");

-- AddForeignKey
ALTER TABLE "mapel" ADD CONSTRAINT "mapel_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_bab" ADD CONSTRAINT "materi_bab_materi_id_fkey" FOREIGN KEY ("materi_id") REFERENCES "materi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_sub_bab" ADD CONSTRAINT "materi_sub_bab_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "materi_bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_progress" ADD CONSTRAINT "materi_progress_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi_progress" ADD CONSTRAINT "materi_progress_materi_id_fkey" FOREIGN KEY ("materi_id") REFERENCES "materi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_bab_progress" ADD CONSTRAINT "sub_bab_progress_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_bab_progress" ADD CONSTRAINT "sub_bab_progress_sub_bab_id_fkey" FOREIGN KEY ("sub_bab_id") REFERENCES "materi_sub_bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulasi_progress" ADD CONSTRAINT "simulasi_progress_simulasi_id_fkey" FOREIGN KEY ("simulasi_id") REFERENCES "simulasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulasi_attempts" ADD CONSTRAINT "simulasi_attempts_simulasi_id_fkey" FOREIGN KEY ("simulasi_id") REFERENCES "simulasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesmen" ADD CONSTRAINT "asesmen_mapel_id_fkey" FOREIGN KEY ("mapel_id") REFERENCES "mapel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal" ADD CONSTRAINT "soal_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_soal_id_fkey" FOREIGN KEY ("soal_id") REFERENCES "soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_asesmen_id_fkey" FOREIGN KEY ("asesmen_id") REFERENCES "asesmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

