-- Corrigir recursividade infinita de uma vez por todas e completar todas as políticas faltantes
-- Este arquivo supersede 20260318143500_fix_infinite_recursion.sql (que ainda será executado antes)
-- 
-- LIMPEZA: Remover TODAS as políticas existentes que possam ter recursão ou estejam incompletas

-- === DEPENDENTS ===
DROP POLICY IF EXISTS "Caregivers can view shared dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can view own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can insert own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can update own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can delete own dependents" ON public.dependents;

-- === CAREGIVER_ACCESS ===
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Caregivers can view own access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can insert access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can update access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can delete access" ON public.caregiver_access;

-- === EVENTS ===
DROP POLICY IF EXISTS "Users can view events of their dependents" ON public.events;
DROP POLICY IF EXISTS "Primary users can insert events" ON public.events;
DROP POLICY IF EXISTS "Primary users can update events" ON public.events;
DROP POLICY IF EXISTS "Primary users can delete events" ON public.events;
DROP POLICY IF EXISTS "Users can manage events of their dependents" ON public.events;

-- === MEDICATIONS ===
DROP POLICY IF EXISTS "Primary users can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can update medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can delete medications" ON public.medications;
DROP POLICY IF EXISTS "Users can manage meds of their dependents" ON public.medications;

-- === MEDICATION_LOGS ===
DROP POLICY IF EXISTS "Primary users can insert logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Primary users can update logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Primary users can view logs" ON public.medication_logs;

-- === THERAPY_NOTES ===
DROP POLICY IF EXISTS "Primary users can insert notes" ON public.therapy_notes;
DROP POLICY IF EXISTS "Primary users can view notes" ON public.therapy_notes;
DROP POLICY IF EXISTS "Primary users can update notes" ON public.therapy_notes;
DROP POLICY IF EXISTS "Primary users can delete notes" ON public.therapy_notes;

-- === DOCUMENTS ===
DROP POLICY IF EXISTS "Primary users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Primary users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Primary users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Primary users can delete documents" ON public.documents;

-- ============================================================
-- FUNÇÕES SECURITY DEFINER (Quebram o loop de recursão)
-- Estas funções consultam tabelas com permissão de superusuário,
-- impedindo que o RLS seja ativado novamente para evitar loops.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_primary_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dependents WHERE id = dep_id AND primary_user_id = auth.uid()
  );
$$;

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

-- Função helper para medication_logs (não tem dependent_id diretamente)
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
    WHERE m.id = med_id AND d.primary_user_id = auth.uid()
  );
$$;

-- ============================================================
-- POLÍTICAS RLS FINAIS USANDO AS FUNÇÕES DEFINER
-- ============================================================

-- === DEPENDENTS ===
CREATE POLICY "Users can view own dependents" ON public.dependents FOR SELECT
  USING (auth.uid() = primary_user_id OR public.is_shared_caregiver(id));

CREATE POLICY "Users can insert own dependents" ON public.dependents FOR INSERT
  WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Users can update own dependents" ON public.dependents FOR UPDATE
  USING (auth.uid() = primary_user_id)
  WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Users can delete own dependents" ON public.dependents FOR DELETE
  USING (auth.uid() = primary_user_id);

-- === CAREGIVER_ACCESS ===
CREATE POLICY "Primary parent can manage access" ON public.caregiver_access FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

CREATE POLICY "Caregivers can view own access" ON public.caregiver_access FOR SELECT
  USING (user_id = auth.uid());

-- === EVENTS ===
CREATE POLICY "Users can manage events" ON public.events FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- === MEDICATIONS ===
CREATE POLICY "Users can manage medications" ON public.medications FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- === MEDICATION_LOGS ===
CREATE POLICY "Users can manage meds logs" ON public.medication_logs FOR ALL
  USING (public.log_belongs_to_user(medication_id))
  WITH CHECK (public.log_belongs_to_user(medication_id));

-- === THERAPY_NOTES ===
CREATE POLICY "Users can manage therapy notes" ON public.therapy_notes FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- === DOCUMENTS ===
CREATE POLICY "Users can manage documents" ON public.documents FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- === PROFILES ===
-- (Não precisam de SECURITY DEFINER pois não referenciam outras tabelas com RLS)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE
  USING (auth.uid() = id);
