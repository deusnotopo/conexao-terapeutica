import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import {
  Goal,
  GoalNote,
  GoalSchema,
  GoalNoteSchema,
  GoalNoteListSchema,
  PaginatedGoalSchema,
} from '../lib/schemas';
import { storage } from '../lib/storage';

export type PaginatedGoals = { data: Goal[]; count: number };

/**
 * Goal Service (Nível Akita — TypeScript)
 * Gerencia o progresso das metas terapêuticas com persistência local e validação rigorosa.
 */
export const goalService = {
  /**
   * Busca metas de um dependente com paginação e cache.
   */
  async getGoals(
    dependentId: string,
    page: number = 0,
    pageSize: number = 20,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedGoals>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `goals:${dependentId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 0) {
        const cached = await storage.getItem<PaginatedGoals>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('therapeutic_goals')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validated = PaginatedGoalSchema.safeParse({ data, count });
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de metas.');
      }

      if (page === 0) {
        await storage.setItem(cacheKey, validated.data);
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar metas';
      return Result.fail(msg);
    }
  },

  /**
   * Cria uma nova meta.
   */
  async createGoal(goalData: Partial<Goal>): Promise<Result<Goal>> {
    try {
      const { data, error } = await supabase
        .from('therapeutic_goals')
        .insert([goalData])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GoalSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Meta criada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar meta';
      return Result.fail(msg);
    }
  },

  /**
   * Atualiza uma meta existente.
   */
  async updateGoal(id: string, updates: Partial<Goal>): Promise<Result<Goal>> {
    try {
      const { data, error } = await supabase
        .from('therapeutic_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GoalSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Meta atualizada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar meta';
      return Result.fail(msg);
    }
  },

  /**
   * Deleta uma meta.
   */
  async deleteGoal(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('therapeutic_goals')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir meta';
      return Result.fail(msg);
    }
  },

  /**
   * Busca notas de progresso de uma meta.
   */
  async getGoalNotes(goalId: string): Promise<Result<GoalNote[]>> {
    try {
      const { data, error } = await supabase
        .from('goal_progress_notes')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (error) return Result.fail(error.message);

      const validated = GoalNoteListSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Erro de integridade nas notas de progresso.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar notas';
      return Result.fail(msg);
    }
  },

  /**
   * Adiciona uma nota de progresso.
   */
  async addGoalNote(goalId: string, note: string): Promise<Result<GoalNote>> {
    try {
      const { data, error } = await supabase
        .from('goal_progress_notes')
        .insert([{ goal_id: goalId, note }])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GoalNoteSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Nota adicionada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao adicionar nota';
      return Result.fail(msg);
    }
  }
};
