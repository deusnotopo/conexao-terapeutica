import { useState, useCallback, useEffect, useRef } from 'react';
import { metricsService, DashboardMetrics } from '../services/metricsService';

export const useDashboardMetrics = (dependentId: string) => {
  const [nextEvent, setNextEvent] = useState<DashboardMetrics['nextEvent']>(null);
  const [stats, setStats] = useState<DashboardMetrics['stats']>({
    eventsToday: 0,
    newDocs: 0,
    activeGoals: 0,
    medsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchMetrics = useCallback(async (isManualRefresh: boolean = false) => {
    if (!dependentId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!isManualRefresh) setLoading(true);
    setError(null);

    const processResult = (res: typeof cached) => {
      if (res.success && res.data) {
        setNextEvent(res.data.nextEvent);
        setStats(res.data.stats);
      }
    };

    // 1. Try Cache
    const cached = await metricsService.fetchDashboardMetrics(dependentId);
    if (cached.success) {
      processResult(cached);
      if (cached.metadata?.fromCache) {
        setLoading(false);
      }
    }

    // 2. Background Refresh
    const fresh = await metricsService.fetchDashboardMetrics(dependentId, { forceRefresh: true });
    
    if (fresh.success) {
      processResult(fresh);
    } else if (!cached.success) {
      setError(fresh.error || 'Erro ao carregar métricas');
    }

    if (!isMounted.current) return;
    setLoading(false);
    setRefreshing(false);
  }, [dependentId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    nextEvent,
    stats,
    loading,
    refreshing,
    error,
    refetch: () => fetchMetrics(true),
  };
};
