ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS recovery_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS recovery_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovery_code_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovery_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_recovery_code_expires_at
  ON public.users (recovery_code_expires_at)
  WHERE recovery_code_hash IS NOT NULL AND recovery_code_used_at IS NULL;

DROP POLICY IF EXISTS "allow all" ON public.users;

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
GRANT ALL ON TABLE public.users TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;