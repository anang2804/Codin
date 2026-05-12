-- Allow quiz scores to store decimal values (e.g. 83.33)
ALTER TABLE public.nilai
ALTER COLUMN score TYPE DOUBLE PRECISION
USING score::DOUBLE PRECISION;
