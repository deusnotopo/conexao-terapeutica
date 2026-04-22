import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { 
  GrowthMeasurementSchema, 
  GrowthMeasurementListSchema,
  Event, // Growth doesn't have a specific type yet in schemas, let's use any or define it
  // Wait, I should check schemas.ts for Growth types
} from '../lib/schemas';
import { storage } from '../lib/storage';

// Since I didn't see an explicit "GrowthMeasurement" type exported in the earlier view of schemas.ts (I only saw the Schema),
// I will ensure I infer it or just use the Schema validation.

/**
 * Growth Service (Akita Mode)
 * Handles persistence for growth measurements with strict type validation.
 */
export const growthService = {
  /**
   * Fetch growth measurements for a dependent.
   */
  async getMeasurements(
    dependentId: string, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<any[]>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `growth:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const { data, error } = await supabase
        .from('growth_measurements')
        .select('*')
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false });

      if (error) return Result.fail(error.message);

      const validated = GrowthMeasurementListSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de crescimento.');
      }

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar medidas de crescimento');
    }
  },

  /**
   * Record a new growth measurement.
   */
  async addMeasurement(measurementData: any): Promise<Result<any>> {
    try {
      const { data, error } = await supabase
        .from('growth_measurements')
        .insert([measurementData])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GrowthMeasurementSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados salvos mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao adicionar medida');
    }
  },

  /**
   * Update an existing measurement.
   */
  async updateMeasurement(id: string, updates: any): Promise<Result<any>> {
    try {
      const { data, error } = await supabase
        .from('growth_measurements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GrowthMeasurementSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados atualizados mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao atualizar medida');
    }
  },

  /**
   * Delete a measurement.
   */
  async deleteMeasurement(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('growth_measurements')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao excluir medida');
    }
  }
};

