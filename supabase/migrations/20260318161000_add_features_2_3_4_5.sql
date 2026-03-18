-- Fase 2: Histórico de Consultas
CREATE TABLE public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  specialty VARCHAR(150) NOT NULL,
  physician_name VARCHAR(200),
  cid_code VARCHAR(20),
  notes TEXT,
  next_appointment DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage consultations" ON public.consultations FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- Fase 4: Rastreador de Gastos
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  amount_cents INTEGER NOT NULL,
  reimbursable BOOLEAN DEFAULT false,
  reimbursed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage expenses" ON public.expenses FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- Fase 5: Metas Terapêuticas
CREATE TABLE public.therapeutic_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'achieved'
  achieved_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.therapeutic_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage goals" ON public.therapeutic_goals FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- Fase 3: Campo de lembrete em medicamentos
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS reminder_times JSONB DEFAULT '[]';
