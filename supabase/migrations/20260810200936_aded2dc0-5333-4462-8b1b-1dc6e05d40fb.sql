ALTER TABLE public.portfolio_reviews
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS contact text,
  ADD COLUMN IF NOT EXISTS service_slug text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_note text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id);

DO $$ BEGIN
  ALTER TABLE public.portfolio_reviews
    ADD CONSTRAINT portfolio_reviews_moderation_status_chk
    CHECK (moderation_status IN ('pending','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS portfolio_reviews_moderation_status_idx
  ON public.portfolio_reviews (moderation_status, submitted_at DESC);