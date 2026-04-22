import { useState, useCallback, useEffect, useRef } from 'react';
import { growthService } from '../services/growthService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';

/**
 * useGrowth Hook
 * Encapsulates the logic for fetching and managing growth measurements.
 */
export const useGrowth = (activeDependentId: string) => {
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    if (!activeDependentId) return;
    
    setLoading(true);

    // 1. SWR Cycle: Try cache first
    const cacheResult = await growthService.getMeasurements(activeDependentId, { forceRefresh: false });
    if (cacheResult.success && cacheResult.metadata?.fromCache) {
      setMeasurements(cacheResult.data!);
      setLoading(false); // Early interactive state
    }

    // 2. Fetch Network
    const networkResult = await growthService.getMeasurements(activeDependentId, { forceRefresh: true });

    if (networkResult.success) {
      setMeasurements(networkResult.data!);
    } else {
      // Only error if we don't have cached data showing
      if (measurements.length === 0) {
        webAlert('Erro', networkResult.error || 'Erro ao carregar dados');
      }
    }

    if (!isMounted.current) return;
    setLoading(false);
    setRefreshing(false);
  }, [activeDependentId, measurements.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const addMeasurement = async (data: any) => {
    const result = await syncService.perform('growthService', 'addMeasurement', [data]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Medida salva offline.', 'info');
      } else {
        showToast('Medida registrada com sucesso!');
        setMeasurements(prev => [result.data, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      return true;
    } else {
      webAlert('Erro ao salvar', result.error || 'Erro desconhecido');
      return false;
    }
  };

  const updateMeasurement = async (id: string, updates: any) => {
    const result = await syncService.perform('growthService', 'updateMeasurement', [id, updates]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Atualização salva offline.', 'info');
      } else {
        showToast('Medida atualizada!');
        setMeasurements(prev => prev.map(m => m.id === id ? result.data : m));
      }
      return true;
    } else {
      webAlert('Erro ao atualizar', result.error || 'Erro desconhecido');
      return false;
    }
  };

  const deleteMeasurement = async (id: string) => {
    const result = await syncService.perform('growthService', 'deleteMeasurement', [id]);
    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Exclusão pendente.', 'info');
      } else {
        showToast('Medida excluída.');
      }
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      return true;
    } else {
      webAlert('Erro ao excluir', result.error || 'Erro desconhecido');
      return false;
    }
  };

  return {
    measurements,
    loading,
    refreshing,
    refresh,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  };
};

