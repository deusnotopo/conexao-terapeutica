import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { VaccineSchema, VaccineListSchema, Vaccine } from '../lib/schemas';
import { storage } from '../lib/storage';

/**
 * Vaccine Service (Nível Akita)
 * Gerencia o histórico de vacinação com cache local SWR.
 */
export const vaccineService = {
  /**
   * Busca vacinas de um dependente com cache.
   */
  async getVaccines(
    dependentId: string, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<Vaccine[]>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `vaccines:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const { data, error } = await supabase
        .from('vaccines')
        .select('*')
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false });

      if (error) return Result.fail(error.message);

      const validated = VaccineListSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de vacinas.');
      }

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar vacinas');
    }
  },

  /**
   * Cria um registro de vacina.
   */
  async createVaccine(vaccineData: Partial<Vaccine>): Promise<Result<Vaccine>> {
    try {
      const { data, error } = await supabase
        .from('vaccines')
        .insert([vaccineData])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = VaccineSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Vacina registrada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao registrar vacina');
    }
  },

  /**
   * Atualiza uma vacina.
   */
  async updateVaccine(id: string, updates: Partial<Vaccine>): Promise<Result<Vaccine>> {
    try {
      const { data, error } = await supabase
        .from('vaccines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = VaccineSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Vacina atualizada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao atualizar vacina');
    }
  },

  /**
   * Deleta uma vacina.
   */
  async deleteVaccine(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('vaccines')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao excluir vacina');
    }
  }
};

