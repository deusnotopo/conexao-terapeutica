import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { TherapyNote, TherapyNoteListSchema } from '../lib/schemas';
import { storage } from '../lib/storage';

/**
 * Therapy Service (Akita Mode — TypeScript)
 * Handles persistence for therapy notes and evolution records.
 */
export const therapyService = {
  /**
   * Fetch therapy notes for a dependent.
   */
  async getNotes(
    dependentId: string,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<TherapyNote[]>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `therapy:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const { data, error } = await supabase
        .from('therapy_notes')
        .select(`
          *,
          profiles:therapist_id (full_name)
        `)
        .eq('dependent_id', dependentId)
        .order('session_date', { ascending: false });

      if (error) return Result.fail(error.message);

      const validated = TherapyNoteListSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Erro de integridade nos registros do prontuário.');
      }

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar notas de terapia');
    }
  }
};
