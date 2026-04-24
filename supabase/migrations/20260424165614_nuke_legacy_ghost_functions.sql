-- =============================================================================
-- Migration: Strict Clean Sweep of V1 Legacy Ghost RLS
-- =============================================================================
-- Correção arquitetural: Em PostgreSQL, `DROP FUNCTION ... CASCADE` NÃO apaga
-- RLS policies! Se apenas dropássemos as funções, as policies fantasmas da V1
-- continuariam existindo e quebrariam a aplicação (Crash de DB em Runtime) ao
-- tentar invocar funções sumidas.
-- Portanto, mandatoriamente limpamos TODAS as velhas policies nominalmente.

-- DEPENDENTS
DROP POLICY IF EXISTS "Caregivers can view shared dependents" ON public.dependents;

-- CAREGIVER_ACCESS
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Caregivers can view own access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can insert access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can update access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary users can delete access" ON public.caregiver_access;

-- EVENTS
DROP POLICY IF EXISTS "Users can manage events" ON public.events;
DROP POLICY IF EXISTS "Primary users can insert events" ON public.events;
DROP POLICY IF EXISTS "Primary users can update events" ON public.events;
DROP POLICY IF EXISTS "Primary users can delete events" ON public.events;
DROP POLICY IF EXISTS "Users can view events of their dependents" ON public.events;
DROP POLICY IF EXISTS "Users can manage events of their dependents" ON public.events;

-- MEDICATIONS
DROP POLICY IF EXISTS "Users can manage medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can update medications" ON public.medications;
DROP POLICY IF EXISTS "Primary users can delete medications" ON public.medications;
DROP POLICY IF EXISTS "Users can manage meds of their dependents" ON public.medications;

-- MEDICATION_LOGS
DROP POLICY IF EXISTS "Users can manage meds logs" ON public.medication_logs;

-- THERAPY_NOTES
DROP POLICY IF EXISTS "Users can manage therapy notes" ON public.therapy_notes;

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can manage documents" ON public.documents;

-- =============================================================================
-- Agora sim é 100% seguro apagar as funções V1:
DROP FUNCTION IF EXISTS public.is_primary_caregiver(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_shared_caregiver(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_belongs_to_user(uuid) CASCADE;
