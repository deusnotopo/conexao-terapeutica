import { useState, useEffect, useCallback, useRef } from 'react';
import { goalService } from '../services/goalService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';
import { Goal, GoalNote } from '../lib/schemas';
import { Result } from '../lib/result';

/**
 * useGoals Hook (Nível Akita — TypeScript)
 * Gerencia a lógica de busca e mutação de metas terapêuticas.
 */
export const useGoals = (dependentId: string) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(
    async (reset: boolean = true) => {
      if (!dependentId) return;

      const currentPage = reset ? 0 : page;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // 1. SWR Cycle: Try cache first (only for first page)
      if (reset) {
        const cacheResult = await goalService.getGoals(dependentId, 0, 20, { forceRefresh: false });
        if (cacheResult.success && cacheResult.data && (cacheResult.metadata as { fromCache?: boolean })?.fromCache) {
          setGoals(cacheResult.data.data);
          setTotal(cacheResult.data.count);
          setPage(1);
          setLoading(false);
        }
      }

      // 2. Fetch Network
      const networkResult = await goalService.getGoals(dependentId, currentPage, 20, { forceRefresh: true });

      if (networkResult.success && networkResult.data) {
        const { data, count } = networkResult.data;
        if (reset) {
          setGoals(data);
          setPage(1);
        } else {
          setGoals((prev) => [...prev, ...data]);
          setPage((prev) => prev + 1);
        }
        setTotal(count);
        setHasMore(data.length === 20);
      } else if (reset && goals.length === 0) {
        webAlert('Erro', networkResult.error || 'Falha ao carregar metas');
      }

      if (!isMounted.current) return;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [dependentId, page, goals.length]
  );

  useEffect(() => {
    fetchData(true);
  }, [dependentId]);

  const refresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchData(false);
    }
  };

  const createGoal = async (goalData: Partial<Goal>) => {
    const result = await syncService.perform('goalService', 'createGoal', [goalData]);
    if (result.success) {
      if (!(result.metadata as { enqueued?: boolean })?.enqueued) {
        setGoals((prev) => [result.data as Goal, ...prev]);
        setTotal((prev) => prev + 1);
      } else {
        showToast('Mudança agendada offline.', 'info');
      }
      return true;
    } else {
      webAlert('Erro ao criar meta', result.error || 'Falha ao criar meta');
      return false;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    const result = await syncService.perform('goalService', 'updateGoal', [id, updates]);
    if (result.success) {
      if (!(result.metadata as { enqueued?: boolean })?.enqueued) {
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...(result.data as Partial<Goal>) } : g)));
      } else {
        showToast('Mudança agendada offline.', 'info');
      }
      return true;
    } else {
      webAlert('Erro ao atualizar meta', result.error || 'Falha ao atualizar meta');
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    const result = await syncService.perform('goalService', 'deleteGoal', [id]);
    if (result.success) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setTotal((prev) => prev - 1);
      if ((result.metadata as { enqueued?: boolean })?.enqueued) showToast('Exclusão agendada offline.', 'info');
      return true;
    } else {
      webAlert('Erro ao excluir meta', result.error || 'Falha ao excluir meta');
      return false;
    }
  };

  const getGoalNotes = async (goalId: string): Promise<Result<GoalNote[]>> => {
    return goalService.getGoalNotes(goalId);
  };

  const addGoalNote = async (goalId: string, note: string): Promise<Result<GoalNote>> => {
    const result = await syncService.perform('goalService', 'addGoalNote', [goalId, note]);
    if (result.success) {
      if ((result.metadata as { enqueued?: boolean })?.enqueued) showToast('Nota agendada offline.', 'info');
      return Result.ok(result.data as GoalNote);
    } else {
      webAlert('Erro ao adicionar nota', result.error || 'Falha ao adicionar nota');
      return Result.fail(result.error || 'Falha ao adicionar nota');
    }
  };

  return {
    goals,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalNotes,
    addGoalNote,
  };
};
