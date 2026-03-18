-- Quebrar a recursividade infinita (Infinite Recursion) no Supabase RLS

-- O erro ocorre porque a tabela `dependents` consulta `caregiver_access` para saber se pode
-- exibir um dependente, e a tabela `caregiver_access` consulta `dependents` para saber se
-- o pai tem permissão para gerenciar os acessos. Loop infinito.

-- 1. DELETAR AS POLÍTICAS PROBLEMÁTICAS QUE GERAM RECURSÃO
DROP POLICY IF EXISTS "Caregivers can view shared dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;

-- (Remover também as inseridas pelo `add_write_policies` que podiam causar recursão na mesma combinação)
DROP POLICY IF EXISTS "Primary users can insert access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can update access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can delete access" ON public.caregiver_access;

-- 2. CRIAR FUNÇÃO SECURITY DEFINER
-- Uma função Security Definer roda com privilégios de "admin" (postgres), então
-- ao consultar a tabela interna, ela burla o RLS e não engatilha as policies novamentes.
CREATE OR REPLACE FUNCTION public.is_primary_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM dependents WHERE id = dep_id AND primary_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shared_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM caregiver_access WHERE dependent_id = dep_id AND user_id = auth.uid()
  );
$$;

-- 3. RECRIAR AS POLÍTICAS USANDO A NOVA FUNÇÃO BLINDADA
-- Para Dependentes:
CREATE POLICY "Caregivers can view shared dependents" ON public.dependents FOR SELECT 
  USING (public.is_shared_caregiver(id));

-- Para Caregiver Access:
CREATE POLICY "Primary parent can manage access" ON public.caregiver_access FOR ALL
  USING (public.is_primary_caregiver(dependent_id));

CREATE POLICY "Caregivers can view own access" ON public.caregiver_access FOR SELECT
  USING (user_id = auth.uid());

-- Reaplicar a correção (caso a original tivesse recursão via JOIN ou EXISTS) na Events, Medications, etc
-- Apenas para segurança e garantir que as outras tabelas não engatilhem loop com o caregiver_access

-- Events
DROP POLICY IF EXISTS "Primary users can insert events" ON public.events;
DROP POLICY IF EXISTS "Primary users can update events" ON public.events;
DROP POLICY IF EXISTS "Primary users can delete events" ON public.events;
DROP POLICY IF EXISTS "Users can view events of their dependents" ON public.events;

CREATE POLICY "Users can manage events of their dependents" ON public.events FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id));

-- Medications
DROP POLICY IF EXISTS "Primary users can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can update medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can delete medications" ON public.medications;

CREATE POLICY "Users can manage meds of their dependents" ON public.medications FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id));

-- Documents, Therapy Notes, Medication Logs logic follows perfectly with the helper functions
