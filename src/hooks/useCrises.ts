import { useState, useCallback, useEffect, useRef } from 'react';
import { crisisService } from '../services/crisisService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';
import { CrisisEvent } from '../lib/schemas';

/**
 * useCrises Hook (TypeScript)
 * Encapsulates the logic for fetching and managing crisis events with pagination.
 */
export const useCrises = (activeDependentId: string) => {
  const [events, setEvents] = useState<CrisisEvent[]>([]);
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
      if (!activeDependentId) return;

      const currentPage = reset ? 0 : page;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // 1. SWR Cycle: Try cache first (only for first page)
      if (reset) {
        const cacheResult = await crisisService.getCrises(activeDependentId, 0, 20, { forceRefresh: false });
        if (cacheResult.success && cacheResult.data && cacheResult.metadata?.fromCache) {
          setEvents(cacheResult.data.data);
          setTotal(cacheResult.data.count);
          setPage(1);
          setLoading(false); // Early interactive state
        }
      }

      // 2. Fetch Network
      const networkResult = await crisisService.getCrises(activeDependentId, currentPage, 20, { forceRefresh: true });

      if (networkResult.success && networkResult.data) {
        const { data, count } = networkResult.data;
        if (reset) {
          setEvents(data);
          setPage(1);
        } else {
          setEvents((prev) => [...prev, ...data]);
          setPage((prev) => prev + 1);
        }
        setTotal(count);
        setHasMore(data.length === 20);
      } else if (reset && events.length === 0) {
        webAlert('Erro', networkResult.error || 'Falha ao carregar eventos de crise');
      }

      if (!isMounted.current) return;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [activeDependentId, page, events.length]
  );

  useEffect(() => {
    fetchData(true);
  }, [activeDependentId]);

  const refresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchData(false);
    }
  };

  const addCrisis = async (data: Partial<CrisisEvent>) => {
    const result = await syncService.perform('crisisService', 'addCrisis', [data]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Crise salva offline.', 'info');
      } else {
        showToast('Evento de crise registrado!', 'success');
        setEvents(prev => [result.data, ...prev]);
        setTotal(prev => prev + 1);
      }
      return true;
    } else {
      webAlert('Erro ao salvar', result.error || 'Falha ao registrar crise');
      return false;
    }
  };

  const updateCrisis = async (id: string, updates: Partial<CrisisEvent>) => {
    const result = await syncService.perform('crisisService', 'updateCrisis', [id, updates]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Atualização salva offline.', 'info');
      } else {
        showToast('Crise atualizada!', 'success');
        setEvents(prev => prev.map(e => e.id === id ? result.data : e));
      }
      return true;
    } else {
      webAlert('Erro ao atualizar', result.error || 'Falha ao atualizar crise');
      return false;
    }
  };

  const deleteCrisis = async (id: string) => {
    const result = await syncService.perform('crisisService', 'deleteCrisis', [id]);
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);
      if (result.metadata?.enqueued) {
        showToast('Exclusão pendente offline.', 'info');
      } else {
        showToast('Evento excluído.', 'success');
      }
      return true;
    } else {
      webAlert('Erro ao excluir', result.error || 'Falha ao excluir crise');
      return false;
    }
  };

  return {
    events,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
    addCrisis,
    updateCrisis,
    deleteCrisis,
  };
};
