CREATE POLICY "Server-side account recovery" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);