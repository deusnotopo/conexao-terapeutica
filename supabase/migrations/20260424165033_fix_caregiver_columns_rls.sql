-- Corrigir a referência de user_id por caregiver_id nas migrações recém-aplicadas (20260424122000 e 20260424130000)
-- que infelizmente introduziram user_id na caregiver_access acidentalmente e aplicaram remotamente antes de notar.

CREATE OR REPLACE FUNCTION public.is_shared_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_access WHERE dependent_id = dep_id AND caregiver_id = auth.uid()
  );
$$;

-- Ajusta também a log_belongs_to_user para permitir que caregivers loguem medicações 
-- (não estava contido nas antigas, estava vetando cuidadores compartilhados)
CREATE OR REPLACE FUNCTION public.log_belongs_to_user(med_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.medications m
    JOIN public.dependents d ON m.dependent_id = d.id
    WHERE m.id = med_id AND (d.user_id = auth.uid() OR public.is_shared_caregiver(d.id))
  );
$$;

-- E a policy de caregiver_access que permitia "view own access" deve checar caregiver_id
DROP POLICY IF EXISTS "Caregivers can view own access" ON public.caregiver_access;
CREATE POLICY "Caregivers can view own access" ON public.caregiver_access FOR SELECT
  USING (caregiver_id = auth.uid());
