import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { ParentDiarySchema, ParentDiary, PaginatedDiarySchema } from '../lib/schemas';
import { storage } from '../lib/storage';

export type PaginatedDiary = { data: ParentDiary[]; count: number };

/**
 * Diary Service (Nível Akita — TypeScript)
 * Gerencia o diário dos pais com persistência SWR e suporte offline.
 */
export const diaryService = {
  /**
   * Busca entradas do diário com paginação e cache.
   */
  async getDiaryEntries(
    dependentId: string,
    page: number = 0,
    pageSize: number = 20,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedDiary>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `diary:${dependentId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 0) {
        const cached = await storage.getItem<PaginatedDiary>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('parent_diary')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validated = PaginatedDiarySchema.safeParse({ data, count });
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados do diário.');
      }

      if (page === 0) {
        await storage.setItem(cacheKey, validated.data);
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar diário';
      return Result.fail(msg);
    }
  },

  /**
   * Cria uma nova entrada no diário.
   */
  async createDiaryEntry(entryData: Partial<ParentDiary>): Promise<Result<ParentDiary>> {
    try {
      const { data, error } = await supabase
        .from('parent_diary')
        .insert([entryData])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = ParentDiarySchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Entrada criada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar entrada';
      return Result.fail(msg);
    }
  },

  /**
   * Atualiza uma entrada do diário.
   */
  async updateDiaryEntry(id: string, updates: Partial<ParentDiary>): Promise<Result<ParentDiary>> {
    try {
      const { data, error } = await supabase
        .from('parent_diary')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = ParentDiarySchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Entrada atualizada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar entrada';
      return Result.fail(msg);
    }
  },

  /**
   * Deleta uma entrada do diário.
   */
  async deleteDiaryEntry(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('parent_diary')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir entrada';
      return Result.fail(msg);
    }
  }
};
