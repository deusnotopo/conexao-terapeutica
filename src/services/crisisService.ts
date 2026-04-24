import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { CrisisEvent, CrisisEventSchema, PaginatedCrisisSchema } from '../lib/schemas';
import { storage } from '../lib/storage';

export type PaginatedCrises = { data: CrisisEvent[]; count: number };

/**
 * Crisis Service (Akita Mode — TypeScript)
 * Handles persistence for crisis events with strict type validation.
 */
export const crisisService = {
  /**
   * Fetch crisis events for a dependent with pagination.
   */
  async getCrises(
    dependentId: string,
    page: number = 0,
    pageSize: number = 20,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedCrises>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `crises:${dependentId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 0) {
        const cached = await storage.getItem<PaginatedCrises>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('crisis_events')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validated = PaginatedCrisisSchema.safeParse({ data, count });
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de crise.');
      }

      if (page === 0) {
        await storage.setItem(cacheKey, validated.data);
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar crises';
      return Result.fail(msg);
    }
  },

  /**
   * Record a new crisis event.
   */
  async addCrisis(crisisData: Partial<CrisisEvent>): Promise<Result<CrisisEvent>> {
    try {
      const { data, error } = await supabase
        .from('crisis_events')
        .insert([crisisData])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = CrisisEventSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados salvos mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao registrar crise';
      return Result.fail(msg);
    }
  },

  /**
   * Update an existing crisis event.
   */
  async updateCrisis(id: string, updates: Partial<CrisisEvent>): Promise<Result<CrisisEvent>> {
    try {
      const { data, error } = await supabase
        .from('crisis_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = CrisisEventSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados atualizados mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar crise';
      return Result.fail(msg);
    }
  },

  /**
   * Delete a crisis event.
   */
  async deleteCrisis(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('crisis_events')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir crise';
      return Result.fail(msg);
    }
  }
};
