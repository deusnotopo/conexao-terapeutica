-- Fix: dependents RLS recursion causing 403 on INSERT
-- is_owner() queries the dependents table, which triggers the SELECT policy again (recursion).
-- Solution: inline the access checks directly in each policy without helper functions.

-- Drop all existing dependents policies
DROP POLICY IF EXISTS dependents_select  ON public.dependents;
DROP POLICY IF EXISTS dependents_insert  ON public.dependents;
DROP POLICY IF EXISTS dependents_update  ON public.dependents;
DROP POLICY IF EXISTS dependents_delete  ON public.dependents;

DROP POLICY IF EXISTS "dependents_select" ON public.dependents;
DROP POLICY IF EXISTS "dependents_insert" ON public.dependents;
DROP POLICY IF EXISTS "dependents_update" ON public.dependents;
DROP POLICY IF EXISTS "dependents_delete" ON public.dependents;

-- SELECT: owner OR shared caregiver (no recursive function call)
CREATE POLICY "dependents_select" ON public.dependents
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.caregiver_access
      WHERE dependent_id = id AND caregiver_id = auth.uid()
    )
  );

-- INSERT: user_id must match the authenticated user
CREATE POLICY "dependents_insert" ON public.dependents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: only the owner can update
CREATE POLICY "dependents_update" ON public.dependents
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: only the owner can delete
CREATE POLICY "dependents_delete" ON public.dependents
  FOR DELETE USING (user_id = auth.uid());
