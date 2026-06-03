-- Create table for forgot password requests that require admin approval
CREATE TABLE IF NOT EXISTS public.forgot_password_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  rejected_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ NULL,
  notes TEXT NULL
);

-- Speed up admin queue queries
CREATE INDEX IF NOT EXISTS idx_forgot_password_requests_status_requested_at
  ON public.forgot_password_requests(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_forgot_password_requests_user_id
  ON public.forgot_password_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_forgot_password_requests_email
  ON public.forgot_password_requests(email);

-- Only one pending request per user per day
CREATE UNIQUE INDEX IF NOT EXISTS uq_forgot_password_requests_user_pending
  ON public.forgot_password_requests(user_id)
  WHERE status = 'pending' AND user_id IS NOT NULL;

