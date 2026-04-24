import { useState, useCallback, useEffect, useRef } from 'react';
import { sleepService } from '../services/sleepService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { SleepLog } from '../lib/schemas';

/**
 * useSleep Hook (Akita Mode)
 * Abstraction for sleep monitoring with offline-first support.
 */
export const useSleep = (dependentId: string) => {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadLogs = useCallback(async (forceRefresh: boolean = false) => {
    if (!dependentId) return;
    
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    const result = await sleepService.getSleepLogs(dependentId, 0, 20, { forceRefresh });
    
    if (!isMounted.current) return;

    if (forceRefresh) setRefreshing(false);
    else setLoading(false);

    if (result.success) {
      setLogs((result.data as { data: SleepLog[] }).data); // result.data contains { data, count }
    } else {
      showToast('Erro ao carregar registros de sono.', 'error');
    }
  }, [dependentId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const addLog = async (logData: Partial<SleepLog>) => {
    const result = await syncService.perform('sleepService', 'createSleepLog', [logData]);
    if (result.success) {
      showToast('Registro de sono salvo!', 'success');
      loadLogs(true);
      return result;
    }
    showToast(result.error || 'Erro ao salvar registro.', 'error');
    return result;
  };

  const updateLog = async (id: string, updates: Partial<SleepLog>) => {
    const result = await syncService.perform('sleepService', 'updateSleepLog', [id, updates]);
    if (result.success) {
      showToast('Registro atualizado!', 'success');
      loadLogs(true);
      return result;
    }
    showToast(result.error || 'Erro ao atualizar registro.', 'error');
    return result;
  };

  const deleteLog = async (id: string) => {
    const result = await syncService.perform('sleepService', 'deleteSleepLog', [id]);
    if (result.success) {
      showToast('Registro removido!', 'success');
      loadLogs(true);
      return result;
    }
    showToast(result.error || 'Erro ao remover registro.', 'error');
    return result;
  };

  return {
    logs,
    loading,
    refreshing,
    refresh: () => loadLogs(true),
    addLog,
    updateLog,
    deleteLog
  };
};

