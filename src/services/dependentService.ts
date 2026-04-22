import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import {
  Dependent,
  DependentSchema,
  DependentListSchema,
  DependentCreateSchema,
  DependentUpdateSchema,
} from '../lib/schemas';
import { storage } from '../lib/storage';

/**
 * Dependent Service (Akita Mode — TypeScript)
 * Handles data for dependents (children) with cache and strict validation.
 */
export const dependentService = {
  /**
   * Fetch dependents for a user (Primary + Shared).
   */
  async getDependents(
    userId: string,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<Dependent[]>> {
    if (!userId) return Result.fail('ID do usuário não fornecido.');

    const cacheKey = `dependents:${userId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const [primaryRes, sharedRes] = await Promise.all([
        supabase.from('dependents').select('*').eq('user_id', userId),
        supabase
          .from('caregiver_access')
          .select('dependent_id, dependents:dependent_id(*)')
          .eq('caregiver_id', userId),
      ]);

      if (primaryRes.error) return Result.fail(`Erro primários: ${primaryRes.error.message}`);
      if (sharedRes.error) return Result.fail(`Erro compartilhados: ${sharedRes.error.message}`);

      const sharedDependents = (sharedRes.data || [])
        .map((a: any) => a.dependents)
        .filter(Boolean);

      const primaryDependents = primaryRes.data || [];

      const allDependents = [
        ...primaryDependents,
        ...sharedDependents.filter(
          (shared: any) => !primaryDependents.some((primary: any) => primary.id === shared.id)
        ),
      ];

      const validated = DependentListSchema.safeParse(allDependents);
      if (!validated.success) {
        return Result.fail('Dados de dependentes inválidos.');
      }

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar dependentes');
    }
  },

  /**
   * Create a new dependent.
   */
  async createDependent(dependentData: Partial<Dependent>): Promise<Result<Dependent>> {
    const validated = DependentCreateSchema.safeParse(dependentData);
    if (!validated.success) {
      return Result.fail(`Dados do dependente inválidos: ${validated.error.issues[0].message}`);
    }
    try {
      const { data, error } = await supabase
        .from('dependents')
        .insert([validated.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const parsedResult = DependentSchema.safeParse(data);
      if (!parsedResult.success) {
        return Result.fail('Dependente criado mas com erro de contrato.');
      }
      return Result.ok(parsedResult.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao criar dependente');
    }
  },

  /**
   * Update an existing dependent.
   */
  async updateDependent(dependentId: string, updates: Partial<Dependent>): Promise<Result<Dependent>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const validated = DependentUpdateSchema.safeParse(updates);
    if (!validated.success) {
      return Result.fail(`Atualização inválida: ${validated.error.issues[0].message}`);
    }

    try {
      const { data, error } = await supabase
        .from('dependents')
        .update(validated.data)
        .eq('id', dependentId)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const parsedResult = DependentSchema.safeParse(data);
      if (!parsedResult.success) {
        return Result.fail('Dependente atualizado mas com erro de contrato.');
      }
      return Result.ok(parsedResult.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao atualizar dependente');
    }
  },

  /**
   * Delete a dependent.
   */
  async deleteDependent(dependentId: string): Promise<Result<{ deletedId: string }>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    try {
      const { error } = await supabase
        .from('dependents')
        .delete()
        .eq('id', dependentId);

      if (error) return Result.fail(error.message);
      return Result.ok({ deletedId: dependentId });
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao excluir dependente');
    }
  },
};
