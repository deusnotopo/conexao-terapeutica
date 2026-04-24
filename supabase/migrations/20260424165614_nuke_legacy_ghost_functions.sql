-- =============================================================================
-- Migration: Clean Sweep - Drop all V1 legacy "Ghost" RLS functions & policies
-- =============================================================================
-- A migração V2 (20260423000000_correct_schema_v2) introduziu uma arquitetura
-- limpa baseada em public.is_owner(), public.is_shared(), e public.can_access().
-- 
-- As funções antigas (is_primary_caregiver, is_shared_caregiver, log_belongs_to_user)
-- estavam servindo apenas para manter VIVAS as antigas policies "Fantasmas" da V1
-- que entravam em conflito com o schema final, duplicando lógicas e causando bugs
-- no "Começar Minha Jornada" (onboarding).
--
-- Usando CASCADE, nós desintegramos as funções legadas e TODAS e QUAISQUER policies 
-- redundantes que dependiam delas em um único passo limpo e definitivo.

DROP FUNCTION IF EXISTS public.is_primary_caregiver(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_shared_caregiver(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_belongs_to_user(uuid) CASCADE;

-- Limpa os resquícios das policies da versão 20260424130000_force_apply_rls_fixes 
-- que poderiam não depender diretamente das funções acima mas eram duplicação.
DROP POLICY IF EXISTS "Caregivers can view own access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Users can manage events" ON public.events;
DROP POLICY IF EXISTS "Users can manage medications" ON public.medications;
DROP POLICY IF EXISTS "Users can manage meds logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can manage therapy notes" ON public.therapy_notes;
DROP POLICY IF EXISTS "Users can manage documents" ON public.documents;
