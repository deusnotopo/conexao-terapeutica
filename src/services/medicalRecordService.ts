import { supabase } from '../lib/supabase';
import { MedicalRecordSchema, MedicalRecord } from '../lib/schemas';
import { Result } from '../lib/result';
import { storage } from '../lib/storage';

const CACHE_KEY = 'medical_records';

/**
 * Serviço de Ficha Médica (Nível Akita)
 * Gerencia informações críticas de saúde e suporte com suporte offline-first.
 */
export const medicalRecordService = {
  /**
   * Busca a ficha médica de um dependente com cache.
   * @param {string} dependentId 
   * @param {object} options
   */
  async getByDependentId(
    dependentId: string, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<MedicalRecord | null>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    try {
      const cacheKey = `${CACHE_KEY}_${dependentId}`;
      
      // 1. Verificar Cache (se não for force refresh)
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      // 2. Buscar do Supabase
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('dependent_id', dependentId)
        .maybeSingle();

      if (error) return Result.fail(error.message);

      // 3. Validar e Atualizar Cache
      if (data) {
        const validated = MedicalRecordSchema.safeParse(data);
        if (!validated.success) return Result.fail('Ficha médica encontrada mas com erro de contrato.');
        
        await storage.setItem(cacheKey, validated.data);
        return Result.ok(validated.data);
      }
      
      return Result.ok(null);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar ficha médica');
    }
  },

  /**
   * Salva ou atualiza a ficha médica (Nível Akita).
   * @param {Partial<MedicalRecord>} record 
   */
  async upsertRecord(record: Partial<MedicalRecord>): Promise<Result<MedicalRecord>> {
    try {
      const validated = MedicalRecordSchema.partial().parse(record);
      
      let query;
      if (validated.id) {
        query = supabase
          .from('medical_records')
          .update({
            ...validated,
            updated_at: new Date().toISOString(),
          })
          .eq('id', validated.id);
      } else {
        query = supabase
          .from('medical_records')
          .insert([validated]);
      }

      const { data, error } = await query.select().single();

      if (error) return Result.fail(error.message);

      // Invalida o cache após alteração
      await storage.removeItem(`${CACHE_KEY}_${validated.dependent_id}`);
      
      const resultData = MedicalRecordSchema.safeParse(data);
      if (!resultData.success) return Result.fail('Ficha salva mas com erro de contrato.');

      return Result.ok(resultData.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao salvar ficha médica');
    }
  }
};

