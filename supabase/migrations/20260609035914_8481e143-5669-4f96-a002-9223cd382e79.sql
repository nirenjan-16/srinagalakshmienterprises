CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON public.users FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.users (username, password_hash)
VALUES ('admin', '$2a$10$Bn.nORhcPA7YuYMKQR0VUeRyTobUrlhSAnUHnHMLGY0RfnZs/Zd26')
ON CONFLICT (username) DO NOTHING;