-- =============================================================================
-- Migration: Fix Dependents RLS (Removendo subqueries iterativas nas políticas)
-- =============================================================================

-- Drop ALL current policies on `dependents` to have a clean slate
DROP POLICY IF EXISTS "dep_select" ON public.dependents;
DROP POLICY IF EXISTS "dep_insert" ON public.dependents;
DROP POLICY IF EXISTS "dep_update" ON public.dependents;
DROP POLICY IF EXISTS "dep_delete" ON public.dependents;

DROP POLICY IF EXISTS "dependents_select" ON public.dependents;
DROP POLICY IF EXISTS "dependents_insert" ON public.dependents;
DROP POLICY IF EXISTS "dependents_update" ON public.dependents;
DROP POLICY IF EXISTS "dependents_delete" ON public.dependents;

DROP POLICY IF EXISTS "Users can view own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Users can insert own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Users can update own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Users can delete own dependents" ON public.dependents;

-- Recreate with DIRECT CHECK against columns instead of security definer functions!
-- The direct check solves the "invisible row" issue inside INSERT...RETURNING evaluations.

CREATE POLICY "dependents_select" ON public.dependents 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR public.is_shared(id)
  );

CREATE POLICY "dependents_insert" ON public.dependents 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "dependents_update" ON public.dependents 
  FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dependents_delete" ON public.dependents 
  FOR DELETE 
  USING (user_id = auth.uid());
