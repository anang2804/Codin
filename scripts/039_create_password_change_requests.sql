-- Create table for guru password change requests that require admin approval
CREATE TABLE IF NOT EXISTS public.password_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  rejected_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ NULL,
  notes TEXT NULL
);

-- Speed up admin queue queries
CREATE INDEX IF NOT EXISTS idx_password_change_requests_status_requested_at
  ON public.password_change_requests(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_change_requests_user_id
  ON public.password_change_requests(user_id);

-- Only one pending request per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_password_change_requests_user_pending
  ON public.password_change_requests(user_id)
  WHERE status = 'pending';
