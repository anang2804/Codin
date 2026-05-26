-- Migration: drop unused columns from `simulasi` table
-- BACKUP your database before running this migration.

BEGIN;

-- Drop columns if they exist
ALTER TABLE public.simulasi DROP COLUMN IF EXISTS thumbnail;
ALTER TABLE public.simulasi DROP COLUMN IF EXISTS tags;

COMMIT;

-- Notes:
-- After running this SQL against the production DB, run `npx prisma db pull`
-- and create/apply a proper Prisma migration to keep schema and DB in sync.
