-- 037_swap_soal_position.sql
-- Atomic reorder helper for soal rows.
-- Call from the client with supabase.rpc('swap_soal_position', ...)

BEGIN;

CREATE OR REPLACE FUNCTION public.swap_soal_position(
  p_soal_id uuid,
  p_direction text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current RECORD;
  v_target RECORD;
  v_temp_position integer := -2147483648;
BEGIN
  SELECT s.id, s.asesmen_id, s.position
    INTO v_current
  FROM public.soal s
  WHERE s.id = p_soal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Soal tidak ditemukan';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.asesmen a
    WHERE a.id = v_current.asesmen_id
      AND a.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Tidak diizinkan';
  END IF;

  IF p_direction = 'up' THEN
    SELECT s.id, s.position
      INTO v_target
    FROM public.soal s
    WHERE s.asesmen_id = v_current.asesmen_id
      AND COALESCE(s.position, 0) < COALESCE(v_current.position, 0)
    ORDER BY COALESCE(s.position, 0) DESC, s.created_at DESC
    LIMIT 1;
  ELSIF p_direction = 'down' THEN
    SELECT s.id, s.position
      INTO v_target
    FROM public.soal s
    WHERE s.asesmen_id = v_current.asesmen_id
      AND COALESCE(s.position, 0) > COALESCE(v_current.position, 0)
    ORDER BY COALESCE(s.position, 0) ASC, s.created_at ASC
    LIMIT 1;
  ELSE
    RAISE EXCEPTION 'Arah tidak valid';
  END IF;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.soal
  SET position = v_temp_position
  WHERE id = v_current.id;

  UPDATE public.soal
  SET position = v_current.position
  WHERE id = v_target.id;

  UPDATE public.soal
  SET position = v_target.position
  WHERE id = v_current.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.swap_soal_position(uuid, text) TO authenticated;

COMMIT;
