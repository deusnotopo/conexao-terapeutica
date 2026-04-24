import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { 
  SleepLogSchema, 
  PaginatedSleepLogSchema,
  SleepLogCreateSchema,
  SleepLogUpdateSchema,
  SleepLog,
  PaginatedResponse,
} from '../lib/schemas';
import { storage } from '../lib/storage';

/**
 * Sleep Service (Nível Akita)
 * Gerencia o monitoramento do sono com persistência local e validação rigorosa.
 */
export const sleepService = {
  /**
   * Busca registros de sono de um dependente com paginação e cache.
   */
  async getSleepLogs(
    dependentId: string, 
    page: number = 0, 
    pageSize: number = 20, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedResponse<SleepLog>>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `sleep:${dependentId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 0) {
        const cached = await storage.getItem<PaginatedResponse<SleepLog>>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('sleep_logs')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validated = PaginatedSleepLogSchema.safeParse({ data, count });
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de sono.');
      }

      if (page === 0) {
        await storage.setItem(cacheKey, validated.data);
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar registros de sono';
      return Result.fail(msg);
    }
  },

  /**
   * Cria um novo registro de sono.
   */
  async createSleepLog(logData: Partial<SleepLog>): Promise<Result<SleepLog>> {
    try {
      const validatedCreate = SleepLogCreateSchema.safeParse(logData);
      if (!validatedCreate.success) {
        return Result.fail(`Dados do sono inválidos: ${validatedCreate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert([validatedCreate.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = SleepLogSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Registro criado mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar registro de sono';
      return Result.fail(msg);
    }
  },

  /**
   * Atualiza um registro de sono existente.
   */
  async updateSleepLog(id: string, updates: Partial<SleepLog>): Promise<Result<SleepLog>> {
    try {
      const validatedUpdate = SleepLogUpdateSchema.safeParse(updates);
      if (!validatedUpdate.success) {
        return Result.fail(`Atualização inválida: ${validatedUpdate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('sleep_logs')
        .update(validatedUpdate.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = SleepLogSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Registro atualizado mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar registro de sono';
      return Result.fail(msg);
    }
  },

  /**
   * Deleta um registro de sono.
   */
  async deleteSleepLog(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir registro de sono';
      return Result.fail(msg);
    }
  }
};

