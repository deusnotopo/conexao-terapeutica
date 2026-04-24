-- Re-definir funções helper de RLS alterando 'primary_user_id' por 'user_id'
-- Isso consertará o erro "column primary_user_id does not exist" nos inserts e selects 
-- das outras tabelas que dependem de dependents (events, medications, etc)

-- 1. Fix is_primary_caregiver
CREATE OR REPLACE FUNCTION public.is_primary_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dependents WHERE id = dep_id AND user_id = auth.uid()
  );
$$;

-- 2. Fix is_shared_caregiver (mesmo não tendo primary_user_id, redefinimos para garantir o schema path seguro)
CREATE OR REPLACE FUNCTION public.is_shared_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_access WHERE dependent_id = dep_id AND user_id = auth.uid()
  );
$$;

-- 3. Fix log_belongs_to_user
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
    WHERE m.id = med_id AND d.user_id = auth.uid()
  );
$$;

-- 4. Fix "is_shared" typo in dependents policy (needs to be is_shared_caregiver)
DROP POLICY IF EXISTS "dependents_select" ON public.dependents;
CREATE POLICY "dependents_select" ON public.dependents 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR public.is_shared_caregiver(id)
  );
