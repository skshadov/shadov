CREATE POLICY "no direct client reads rate limits" ON public.submission_rate_limits FOR SELECT TO authenticated USING (false);
CREATE POLICY "no direct client writes rate limits" ON public.submission_rate_limits FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no direct client updates rate limits" ON public.submission_rate_limits FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no direct client deletes rate limits" ON public.submission_rate_limits FOR DELETE TO authenticated USING (false);