-- Diretório de Profissionais
CREATE TABLE public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  specialty VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(200),
  clinic VARCHAR(200),
  address TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage professionals" ON public.professionals FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));
