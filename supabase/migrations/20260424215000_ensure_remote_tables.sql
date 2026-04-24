CREATE TABLE IF NOT EXISTS public.goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','achieved','abandoned')),
  target_date  DATE,
  achieved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.goal_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.goal_notes ENABLE ROW LEVEL SECURITY;
