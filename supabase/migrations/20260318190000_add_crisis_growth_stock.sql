-- Rastreador de Crises
CREATE TABLE public.crisis_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME,
  duration_minutes INTEGER,
  type VARCHAR(100) NOT NULL DEFAULT 'Não classificado',
  triggers TEXT,
  symptoms TEXT,
  post_episode TEXT,
  severity INTEGER DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
  medication_given VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.crisis_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage crisis events" ON public.crisis_events FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- Curva de Crescimento
CREATE TABLE public.growth_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,1),
  head_cm DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage growth" ON public.growth_measurements FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- Estoque de Medicamentos (adicionar coluna)
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT NULL;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS stock_alert_at INTEGER DEFAULT 5;
