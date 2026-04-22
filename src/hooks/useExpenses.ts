import { useState, useCallback, useEffect, useRef } from 'react';
import { expenseService } from '../services/expenseService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { webAlert } from '../lib/webAlert';
import { Expense } from '../lib/schemas';

/**
 * useExpenses Hook (TypeScript)
 * Encapsulates all state and logic for the Expenses Screen.
 */
export const useExpenses = (dependentId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalMonthCents, setTotalMonthCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const PAGE_SIZE = 20;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchExpensesData = useCallback(
    async (reset: boolean = true) => {
      if (!dependentId) return;

      const currentPage = reset ? 0 : page;
      
      if (reset && !refreshing) setLoading(true);
      if (!reset) setLoadingMore(true);

      setError(null);

      const processResult = (res: { success: boolean; data?: { data: Expense[]; count: number } | null }) => {
        if (res.success && res.data) {
          const { data, count } = res.data;
          if (reset) {
            setExpenses(data);
            setPage(1);
          } else {
            setExpenses((prev) => [...prev, ...data]);
            setPage((prev) => prev + 1);
          }
          setTotalCount(count);
          setHasMore(data.length === PAGE_SIZE && (reset ? data.length : expenses.length + data.length) < count);
        }
      };

      // 1. First Page / Cache
      if (reset) {
        const cached = await expenseService.fetchExpenses(dependentId, 0, PAGE_SIZE);
        if (cached.success) {
          processResult(cached);
          if (cached.metadata?.fromCache) {
            setLoading(false);
          }
        }

        const cachedTotal = await expenseService.fetchCurrentMonthTotal(dependentId);
        if (cachedTotal.success) setTotalMonthCents(cachedTotal.data ?? 0);
      }

      // 2. Network Fetch
      const result = await expenseService.fetchExpenses(dependentId, currentPage, PAGE_SIZE, { forceRefresh: true });
      
      if (result.success) {
        processResult(result);
        if (reset) {
          const freshTotal = await expenseService.fetchCurrentMonthTotal(dependentId, { forceRefresh: true });
          if (freshTotal.success) setTotalMonthCents(freshTotal.data ?? 0);
        }
      } else if (expenses.length === 0) {
        setError(result.error || 'Erro desconhecido');
      }

      if (!isMounted.current) return;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [dependentId, page, refreshing, expenses.length]
  );

  useEffect(() => {
    fetchExpensesData(true);
  }, [dependentId]);

  const refresh = () => {
    setRefreshing(true);
    fetchExpensesData(true);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchExpensesData(false);
  };

  const addExpense = async (data: Partial<Expense>) => {
    const result = await syncService.perform('expenseService', 'createExpense', [data]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Gasto salvo offline.', 'info');
      } else {
        showToast('Gasto registrado!', 'success');
        setExpenses((prev) => [result.data, ...prev]);
        setTotalCount((prev) => prev + 1);
      }
      return true;
    } else {
      webAlert('Erro ao salvar', result.error || 'Falha ao registrar despesa');
      return false;
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    const result = await syncService.perform('expenseService', 'updateExpense', [id, data]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Alteração salva offline.', 'info');
      } else {
        showToast('Gasto atualizado!', 'success');
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...result.data } : e)));
      }
      return true;
    } else {
      webAlert('Erro ao atualizar', result.error || 'Falha ao atualizar despesa');
      return false;
    }
  };

  const removeExpense = async (id: string) => {
    const result = await syncService.perform('expenseService', 'deleteExpense', [id]);
    if (result.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (result.metadata?.enqueued) {
        showToast('Exclusão pendente offline.', 'info');
      } else {
        showToast('Despesa excluída.', 'success');
      }
      return true;
    } else {
      webAlert('Erro ao excluir', result.error || 'Falha ao excluir despesa');
      return false;
    }
  };

  return {
    expenses,
    totalMonthCents,
    totalCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    addExpense,
    updateExpense,
    removeExpense,
  };
};
