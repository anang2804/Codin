-- Migration: drop unused columns from `nilai` table
-- BACKUP your database before running this migration.

BEGIN;

-- Drop columns if they exist
ALTER TABLE public.nilai DROP COLUMN IF EXISTS status;
ALTER TABLE public.nilai DROP COLUMN IF EXISTS submitted_at;

COMMIT;

-- Notes:
-- After running this SQL against the production DB, run `npx prisma db pull`
-- and `npx prisma migrate dev` locally if you use Prisma migrations, or
-- create a proper Prisma migration to keep schema and DB in sync.
