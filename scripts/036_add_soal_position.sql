-- 036_add_soal_position.sql
-- Add an integer `position` column to `soal` for ordering and populate existing rows

BEGIN;

ALTER TABLE soal
  ADD COLUMN IF NOT EXISTS position integer;

-- Populate positions per asesmen ordered by created_at
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY asesmen_id ORDER BY created_at) AS rn
  FROM soal
)
UPDATE soal
SET position = ordered.rn
FROM ordered
WHERE soal.id = ordered.id;

-- Make position NOT NULL to ensure ordering
ALTER TABLE soal
  ALTER COLUMN position SET NOT NULL;

COMMIT;
