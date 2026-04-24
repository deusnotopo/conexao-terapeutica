import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { 
  MedicationSchema, 
  MedicationListSchema, 
  MedicationLogSchema, 
  MedicationLogListSchema,
  MedicationCreateSchema,
  MedicationUpdateSchema,
  Medication,
  MedicationLog
} from '../lib/schemas';
import { storage } from '../lib/storage';

/**
 * Medication Service (Akita Mode)
 * Handles persistence for medications with strict type validation.
 */
export const medicationService = {
  /**
   * Fetch all medications for a dependent.
   */
  async getMedications(
    dependentId: string, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<Medication[]>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `medications:${dependentId}`;
    try {
      // 1. Check cache first
      if (!options.forceRefresh) {
        const cached = await storage.getItem<Medication[]>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      // 2. Fetch fresh from Supabase
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('dependent_id', dependentId)
        .order('name', { ascending: true });

      if (error) return Result.fail(error.message);

      const validated = MedicationListSchema.safeParse(data || []);
      if (!validated.success) {
        return Result.fail('Erro de integridade nos dados de medicamentos.');
      }

      // 3. Update cache
      await storage.setItem(cacheKey, validated.data);

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar medicamentos';
      return Result.fail(msg);
    }
  },

  /**
   * Update medication stock.
   */
  async updateStock(id: string, newCount: number): Promise<Result<Medication>> {
    try {
      const { data, error } = await supabase
        .from('medications')
        .update({ stock_count: Math.max(0, newCount) })
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = MedicationSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Estoque atualizado mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar estoque';
      return Result.fail(msg);
    }
  },

  /**
   * Toggle medication active status.
   */
  async toggleActive(id: string, isActive: boolean): Promise<Result<Medication>> {
    try {
      const { data, error } = await supabase
        .from('medications')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = MedicationSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Status atualizado mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alterar status';
      return Result.fail(msg);
    }
  },

  /**
   * Delete a medication record.
   */
  async deleteMedication(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir medicamento';
      return Result.fail(msg);
    }
  },

  /**
   * Log medication as taken.
   */
  async logTaken(medicationId: string, notes: string | null = null): Promise<Result<MedicationLog>> {
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .insert([{
          medication_id: medicationId,
          taken_at: new Date().toISOString(),
          status: 'taken',
          notes
        }])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = MedicationLogSchema.safeParse(data);
      if (!validated.success) return Result.fail('Dose registrada mas com erro de contrato.');

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao registrar dose';
      return Result.fail(msg);
    }
  },

  /**
   * Fetch logs for today.
   */
  async getTodaysLogs(dependentId: string, options: { forceRefresh?: boolean } = { forceRefresh: false }): Promise<Result<MedicationLog[]>> {
    const cacheKey = `medication_logs_today:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<MedicationLog[]>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('medication_logs')
        .select('*, medication:medications(dependent_id)')
        .gte('taken_at', startOfDay.toISOString());

      if (error) return Result.fail(error.message);

      const filtered = (data || []).filter((log: { medication?: { dependent_id: string } }) => log.medication?.dependent_id === dependentId);
      const validated = MedicationLogListSchema.safeParse(filtered);
      if (!validated.success) return Result.fail('Erro de integridade nos logs de hoje.');

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar logs de hoje';
      return Result.fail(msg);
    }
  },

  /**
   * Fetch logs within a date range for a dependent.
   */
  async getHistoricalLogs(dependentId: string, startDateISO: string): Promise<Result<MedicationLog[]>> {
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*, medication:medications(dependent_id, name, dosage)')
        .gte('taken_at', startDateISO)
        .order('taken_at', { ascending: false });

      if (error) return Result.fail(error.message);

      // Filter by dependent_id since it's a join
      const filtered = (data || []).filter((log: { medication?: { dependent_id: string } }) => log.medication?.dependent_id === dependentId) as MedicationLog[];
      return Result.ok(filtered);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar histórico de doses';
      return Result.fail(msg);
    }
  },

  /**
   * Create a new medication.
   */
  async createMedication(medicationData: Partial<Medication>): Promise<Result<Medication>> {
    try {
      const validated = MedicationCreateSchema.safeParse(medicationData);
      if (!validated.success) {
        return Result.fail(`Dados inválidos: ${validated.error.issues[0].message}`);
      }
      
      const { data, error } = await supabase
        .from('medications')
        .insert([validated.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const result = MedicationSchema.safeParse(data);
      if (!result.success) return Result.fail('Medicamento criado mas com erro de contrato.');

      return Result.ok(result.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao adicionar medicamento';
      return Result.fail(msg);
    }
  },

  /**
   * Update an existing medication.
   */
  async updateMedication(id: string, updates: Partial<Medication>): Promise<Result<Medication>> {
    try {
      const validated = MedicationUpdateSchema.safeParse(updates);
      if (!validated.success) {
        return Result.fail(`Atualização inválida: ${validated.error.issues[0].message}`);
      }

      const { data, error } = await supabase
        .from('medications')
        .update(validated.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const result = MedicationSchema.safeParse(data);
      if (!result.success) return Result.fail('Medicamento atualizado mas com erro de contrato.');

      return Result.ok(result.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao atualizar medicamento';
      return Result.fail(msg);
    }
  }
};

