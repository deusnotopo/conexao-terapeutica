import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { 
  CaregiverWellbeingSchema, 
  CaregiverWellbeingListSchema, 
  PaginatedWellbeingSchema,
  WellbeingCreateSchema,
  WellbeingUpdateSchema,
  CaregiverWellbeing 
} from '../lib/schemas';
import { storage } from '../lib/storage';

export type PaginatedWellbeing = { data: CaregiverWellbeing[]; count: number };

/**
 * Wellbeing Service (Nível Akita)
 * Gerencia o registro de bem-estar dos cuidadores com suporte offline-first.
 */
export const wellbeingService = {
  /**
   * Busca registros de bem-estar com paginação e cache.
   */
  async getWellbeingLogs(
    userId: string, 
    page: number = 0, 
    pageSize: number = 20, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedWellbeing>> {
    if (!userId) return Result.fail('ID do usuário não fornecido.');

    const cacheKey = `wellbeing:${userId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 0) {
        const cached = await storage.getItem<PaginatedWellbeing>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from('caregiver_wellbeing')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validated = PaginatedWellbeingSchema.safeParse({ data, count });
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de bem-estar.');
      }

      if (page === 0) {
        await storage.setItem(cacheKey, validated.data);
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      return Result.fail(msg);
    }
  },

  /**
   * Cria um novo registro de bem-estar.
   */
  async createWellbeingLog(logData: Partial<CaregiverWellbeing>): Promise<Result<CaregiverWellbeing>> {
    try {
      const validatedCreate = WellbeingCreateSchema.safeParse(logData);
      if (!validatedCreate.success) {
        return Result.fail(`Dados de bem-estar inválidos: ${validatedCreate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('caregiver_wellbeing')
        .insert([validatedCreate.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = CaregiverWellbeingSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Registro criado mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar registro';
      return Result.fail(msg);
    }
  },

  /**
   * Atualiza um registro de bem-estar.
   */
  async updateWellbeingLog(id: string, updates: Partial<CaregiverWellbeing>): Promise<Result<CaregiverWellbeing>> {
    try {
      const validatedUpdate = WellbeingUpdateSchema.safeParse(updates);
      if (!validatedUpdate.success) {
        return Result.fail(`Atualização inválida: ${validatedUpdate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('caregiver_wellbeing')
        .update(validatedUpdate.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = CaregiverWellbeingSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Registro atualizado mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar registro';
      return Result.fail(msg);
    }
  },

  /**
   * Deleta um registro de bem-estar.
   */
  async deleteWellbeingLog(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('caregiver_wellbeing')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir registro';
      return Result.fail(msg);
    }
  }
};
