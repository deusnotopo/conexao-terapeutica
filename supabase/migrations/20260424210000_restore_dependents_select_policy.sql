-- =============================================================================
-- Migration: Restauração da Policy de SELECT de Dependents
-- =============================================================================
-- O CASCADE ao dropar as funções legadas acabou apagando a policy 
-- de SELECT da tabela dependents porque uma das nossas migrations intermediárias
-- havia linkado ela à função is_shared_caregiver() ao invés da is_shared()
-- =============================================================================

-- Limpar qualquer policy de dependents que ainda resista
DROP POLICY IF EXISTS "dependents_select" ON public.dependents;
DROP POLICY IF EXISTS "dependents_insert" ON public.dependents;
DROP POLICY IF EXISTS "dependents_update" ON public.dependents;
DROP POLICY IF EXISTS "dependents_delete" ON public.dependents;
DROP POLICY IF EXISTS "dep_select" ON public.dependents;
DROP POLICY IF EXISTS "dep_insert" ON public.dependents;
DROP POLICY IF EXISTS "dep_update" ON public.dependents;
DROP POLICY IF EXISTS "dep_delete" ON public.dependents;

-- Recriar as 4 funcionais e definitivas
CREATE POLICY "dependents_select" ON public.dependents FOR SELECT
  USING (public.can_access(id));

CREATE POLICY "dependents_insert" ON public.dependents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dependents_update" ON public.dependents FOR UPDATE
  USING (public.is_owner(id))
  WITH CHECK (public.is_owner(id));

CREATE POLICY "dependents_delete" ON public.dependents FOR DELETE
  USING (public.is_owner(id));
