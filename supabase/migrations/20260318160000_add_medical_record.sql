-- Fase 1: Ficha Médica Completa
CREATE TABLE public.medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blood_type VARCHAR(10),
  health_plan VARCHAR(150),
  health_plan_number VARCHAR(100),
  allergies TEXT,
  primary_physician_name VARCHAR(200),
  primary_physician_phone VARCHAR(30),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(30),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage medical records" ON public.medical_records FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));
