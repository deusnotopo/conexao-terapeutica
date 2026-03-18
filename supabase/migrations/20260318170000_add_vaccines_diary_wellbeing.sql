-- Novas tabelas: Vacinas, Diário dos Pais, Bem-Estar do Cuidador

-- 1. Caderneta de Vacinas
CREATE TABLE public.vaccines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  applied_date DATE,
  next_dose_date DATE,
  dose_number INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage vaccines" ON public.vaccines FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- 2. Diário dos Pais (Observações diárias)
CREATE TABLE public.parent_diary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood VARCHAR(20) NOT NULL DEFAULT 'good', -- 'great','good','hard','very_hard'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.parent_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage parent diary" ON public.parent_diary FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- 3. Bem-Estar do Cuidador
CREATE TABLE public.caregiver_wellbeing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL UNIQUE,
  mood VARCHAR(20) NOT NULL DEFAULT 'good', -- 'great','good','tired','overwhelmed'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.caregiver_wellbeing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wellbeing" ON public.caregiver_wellbeing FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
