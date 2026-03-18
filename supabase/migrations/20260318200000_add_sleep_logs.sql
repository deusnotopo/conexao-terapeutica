-- Diário de Sono
CREATE TABLE public.sleep_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sleep_time TIME,
  wake_time TIME,
  duration_hours DECIMAL(4,2),
  quality INTEGER DEFAULT 3 CHECK (quality BETWEEN 1 AND 5),
  awakenings INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage sleep logs" ON public.sleep_logs FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));
