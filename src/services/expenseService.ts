import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import {
  Expense,
  ExpenseSchema,
  PaginatedExpenseSchema,
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
} from '../lib/schemas';
import { storage } from '../lib/storage';

export type PaginatedExpenses = { data: Expense[]; count: number };

/**
 * Expense Service (Akita Style — TypeScript)
 * Manages financial data with strict validation and standard returns.
 */
export const expenseService = {
  /**
   * Fetch expenses for a dependent with pagination.
   */
  async fetchExpenses(
    dependentId: string,
    page: number = 0,
    pageSize: number = 20,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedExpenses>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `expenses:${dependentId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 0) {
        const cached = await storage.getItem<PaginatedExpenses>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validation = PaginatedExpenseSchema.safeParse({ data, count });
      if (!validation.success) {
        return Result.fail('Dados corrompidos recebidos do servidor.');
      }

      if (page === 0) {
        await storage.setItem(cacheKey, validation.data);
      }

      return Result.ok(validation.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar despesas';
      return Result.fail(msg);
    }
  },

  /**
   * Create an expense with Zod validation.
   */
  async createExpense(expense: Partial<Expense>): Promise<Result<Expense>> {
    const validation = ExpenseCreateSchema.safeParse(expense);
    if (!validation.success) {
      return Result.fail(`Dados da despesa inválidos: ${validation.error.issues[0].message}`);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([validation.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = ExpenseSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Despesa criada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar despesa';
      return Result.fail(msg);
    }
  },

  /**
   * Update an expense with Zod validation.
   */
  async updateExpense(id: string, updates: Partial<Expense>): Promise<Result<Expense>> {
    const validation = ExpenseUpdateSchema.safeParse(updates);
    if (!validation.success) {
      return Result.fail(`Atualização inválida: ${validation.error.issues[0].message}`);
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = ExpenseSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Despesa atualizada mas com erro de contrato.');
      }

      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar despesa';
      return Result.fail(msg);
    }
  },

  /**
   * Delete an expense.
   */
  async deleteExpense(expenseId: string): Promise<Result<boolean>> {
    if (!expenseId) return Result.fail('ID da despesa não fornecido.');

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir despesa';
      return Result.fail(msg);
    }
  },

  /**
   * Compute total expenses for the current month.
   */
  async fetchCurrentMonthTotal(
    dependentId: string,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<number>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `expenses_month_total:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<number>(cacheKey);
        if (cached !== null) return Result.ok(cached, { fromCache: true });
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .select('amount_cents')
        .eq('dependent_id', dependentId)
        .gte('date', monthStart);

      if (error) return Result.fail(error.message);

      const total = (data || []).reduce((sum, e: { amount_cents: number }) => sum + e.amount_cents, 0);
      await storage.setItem(cacheKey, total);

      return Result.ok(total);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao calcular total mensal';
      return Result.fail(msg);
    }
  },
};
