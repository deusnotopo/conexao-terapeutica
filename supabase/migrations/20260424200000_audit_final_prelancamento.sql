-- =============================================================================
-- Migration: Auditoria Final Pré-Lançamento
-- Corrige tabelas com RLS habilitada mas ZERO policies (= completamente bloqueadas)
-- Descobre e corrige tabelas V1 legadas sem uso pelo app TypeScript atual
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. THERAPY_NOTES — tabela usada pelo therapyService.ts
--    Estava com RLS ativa e 0 policies → todos os reads retornavam vazio
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "therapy_all" ON public.therapy_notes;
CREATE POLICY "therapy_all" ON public.therapy_notes FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- ---------------------------------------------------------------------------
-- 2. THERAPEUTIC_GOALS — tabela V1 obsoleta (app usa 'goals' do V2)
--    Nenhum service TS usa esta tabela. Mantemos mas bloqueamos via policy
--    de acesso nulo para evitar vazamentos de dados.
--    (Drop seria mais limpo mas pode quebrar FKs se houver — seguro assim)
-- ---------------------------------------------------------------------------
-- Sem policy = acesso negado com RLS ativa. Já está correto, mantemos assim.

-- ---------------------------------------------------------------------------
-- 3. GOAL_PROGRESS_NOTES — tabela V1 obsoleta (app usa 'goal_notes' do V2)
--    Mesmo caso que therapeutic_goals.
-- ---------------------------------------------------------------------------
-- Sem policy = acesso negado com RLS ativa. Já está correto, mantemos assim.

-- ---------------------------------------------------------------------------
-- 4. Garantir que profiles tem a policy de INSERT para o trigger handle_new_user
--    (precisa de SECURITY DEFINER mas explicitamos para o Supabase Dashboard)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable insert for authenticated users on own profile" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users on own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 5. Garantir coluna reminder_times como TEXT[] (não JSONB como V1 criou)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT udt_name INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'medications' AND column_name = 'reminder_times';

  IF col_type = 'jsonb' THEN
    -- Renomear coluna antiga, criar nova como TEXT[], migrar dados, dropar antiga
    ALTER TABLE public.medications RENAME COLUMN reminder_times TO reminder_times_jsonb;
    ALTER TABLE public.medications ADD COLUMN reminder_times TEXT[] DEFAULT '{}';
    UPDATE public.medications
      SET reminder_times = (
        SELECT ARRAY_AGG(elem)
        FROM jsonb_array_elements_text(reminder_times_jsonb) AS elem
      )
      WHERE reminder_times_jsonb IS NOT NULL;
    ALTER TABLE public.medications DROP COLUMN reminder_times_jsonb;
  END IF;
  -- Se já for TEXT[] ou _text, não faz nada
END $$;

