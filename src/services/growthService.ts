import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { 
  GrowthMeasurementSchema, 
  GrowthMeasurementListSchema,
  GrowthCreateSchema,
  GrowthUpdateSchema,
  GrowthMeasurement,
} from '../lib/schemas';
import { storage } from '../lib/storage';

export type { GrowthMeasurement };

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
  ): Promise<Result<GrowthMeasurement[]>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `growth:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<GrowthMeasurement[]>(cacheKey);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar medidas de crescimento';
      return Result.fail(msg);
    }
  },

  /**
   * Record a new growth measurement.
   */
  async addMeasurement(measurementData: Omit<GrowthMeasurement, 'id' | 'created_at'>): Promise<Result<GrowthMeasurement>> {
    try {
      const validatedCreate = GrowthCreateSchema.safeParse(measurementData);
      if (!validatedCreate.success) {
        return Result.fail(`Dados de crescimento inválidos: ${validatedCreate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('growth_measurements')
        .insert([validatedCreate.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GrowthMeasurementSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados salvos mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao adicionar medida';
      return Result.fail(msg);
    }
  },

  /**
   * Update an existing measurement.
   */
  async updateMeasurement(id: string, updates: Partial<GrowthMeasurement>): Promise<Result<GrowthMeasurement>> {
    try {
      const validatedUpdate = GrowthUpdateSchema.safeParse(updates);
      if (!validatedUpdate.success) {
        return Result.fail(`Atualização inválida: ${validatedUpdate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('growth_measurements')
        .update(validatedUpdate.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = GrowthMeasurementSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados atualizados mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar medida';
      return Result.fail(msg);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir medida';
      return Result.fail(msg);
    }
  }
};

