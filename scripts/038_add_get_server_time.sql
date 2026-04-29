-- 038_add_get_server_time.sql
-- Return database time so client quizzes do not depend on the student's device clock.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT now();
$$;

GRANT EXECUTE ON FUNCTION public.get_server_time() TO authenticated;

COMMIT;