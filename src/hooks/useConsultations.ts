import { useState, useEffect, useCallback, useRef } from 'react';
import { agendaService } from '../services/agendaService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { webAlert } from '../lib/webAlert';
import { notificationService } from '../services/notificationService';
import { Consultation } from '../lib/schemas';

export function useConsultations(dependentId: string, pageSize: number = 20) {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchConsultations = useCallback(async (reset: boolean = false) => {
    if (!dependentId) return;
    
    const nextPage = reset ? 1 : page;
    if (reset) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    const processResult = (res: { success: boolean; data?: { data: Consultation[]; count: number } | null }, isReset: boolean) => {
      if (res.success && res.data) {
        const { data, count } = res.data;
        const updatedItems = isReset ? data : [...items, ...data];
        setItems(updatedItems);
        setTotal(count);
        setHasMore(updatedItems.length < count);
        setPage(nextPage + 1);
        notificationService.syncConsultationReminders(updatedItems);
      }
    };

    // 1. Initial Load / Cache (only for first page)
    if (nextPage === 1) {
      const cached = await agendaService.getConsultations(dependentId, 1, pageSize);
      if (cached.success) {
        processResult(cached, true);
        if (cached.metadata?.fromCache) {
          setLoading(false);
        }
      }
    }

    // 2. Network Fetch
    const result = await agendaService.getConsultations(dependentId, nextPage, pageSize, { forceRefresh: true });
    
    if (result.success) {
      processResult(result, reset);
    } else if (items.length === 0) {
      webAlert('Erro', result.error || 'Falha ao carregar consultas');
    }

    if (!isMounted.current) return;
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [dependentId, page, pageSize, items]);

  useEffect(() => {
    fetchConsultations(true);
  }, [dependentId]);

  const refresh = () => fetchConsultations(true);
  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchConsultations(false);
    }
  };

  const deleteById = async (id: string) => {
    const result = await syncService.perform('agendaService', 'deleteConsultation', [id]);
    if (result.success) {
      setItems(prev => {
        const updated = prev.filter(c => c.id !== id);
        notificationService.syncConsultationReminders(updated);
        return updated;
      });
      setTotal(prev => prev - 1);
      if (result.metadata?.enqueued) showToast('Exclusão agendada offline.', 'info');
      return true;
    } else {
      webAlert('Erro', result.error || 'Falha ao excluir consulta');
      return false;
    }
  };

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
    deleteById,
  };
}
