-- Notas de progresso em metas terapêuticas
CREATE TABLE public.goal_progress_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.therapeutic_goals(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.goal_progress_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage goal notes" ON public.goal_progress_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.therapeutic_goals g
      JOIN public.dependents d ON d.id = g.dependent_id
      WHERE g.id = goal_progress_notes.goal_id
        AND public.is_primary_caregiver(d.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.therapeutic_goals g
      JOIN public.dependents d ON d.id = g.dependent_id
      WHERE g.id = goal_progress_notes.goal_id
        AND public.is_primary_caregiver(d.id)
    )
  );

-- Convites de cuidadores
CREATE TABLE public.caregiver_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  invited_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.caregiver_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inviter can manage invites" ON public.caregiver_invites FOR ALL
  USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

-- Anotações pré-consulta
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pre_notes TEXT;
