import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { ProfessionalSchema, Professional, ProfessionalListSchema } from '../lib/schemas';
import { storage } from '../lib/storage';

export const professionalService = {
  /**
   * Busca profissionais associados a um dependente com cache.
   */
  async getByDependent(
    dependentId: string, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<Professional[]>> {
    const cacheKey = `professionals:${dependentId}`;
    try {
      if (!dependentId) return Result.fail('ID do dependente é obrigatório');

      if (!options.forceRefresh) {
        const cached = await storage.getItem<Professional[]>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('dependent_id', dependentId)
        .order('name', { ascending: true });

      if (error) return Result.fail(`Erro ao buscar profissionais: ${error.message}`);

      const validated = ProfessionalListSchema.safeParse(data || []);
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de profissionais.');
      }

      await storage.setItem(cacheKey, validated.data);

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao carregar profissionais';
      return Result.fail(msg);
    }
  },

  /**
   * Adiciona um novo profissional.
   */
  async create(professionalData: Partial<Professional>): Promise<Result<Professional>> {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .insert([professionalData])
        .select()
        .single();

      if (error) return Result.fail(`Erro ao criar profissional: ${error.message}`);

      const validated = ProfessionalSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Profissional criado mas com erro de contrato.');
      }
      
      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao adicionar profissional';
      return Result.fail(msg);
    }
  },

  /**
   * Atualiza os dados de um profissional.
   */
  async update(id: string, updates: Partial<Professional>): Promise<Result<Professional>> {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(`Erro ao atualizar profissional: ${error.message}`);

      const validated = ProfessionalSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados atualizados mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao atualizar profissional';
      return Result.fail(msg);
    }
  },

  /**
   * Remove um profissional.
   */
  async delete(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(`Erro ao excluir profissional: ${error.message}`);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao excluir profissional';
      return Result.fail(msg);
    }
  }
};

