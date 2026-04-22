import { useState, useCallback, useEffect, useRef } from 'react';
import { vaccineService } from '../services/vaccineService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { notificationService } from '../services/notificationService';
import { Vaccine } from '../lib/schemas';

/**
 * useVaccines Hook (Akita Mode)
 * Abstraction for vaccination history with offline-first support.
 */
export const useVaccines = (dependentId: string) => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadVaccines = useCallback(async (forceRefresh: boolean = false) => {
    if (!dependentId) return;
    
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    const result = await vaccineService.getVaccines(dependentId, { forceRefresh });
    
    if (!isMounted.current) return;

    if (forceRefresh) setRefreshing(false);
    else setLoading(false);

    if (result.success) {
      setVaccines(result.data!);
      notificationService.syncVaccineReminders(result.data!);
    } else {
      showToast('Erro ao carregar histórico de vacinas.', 'error');
    }
  }, [dependentId]);

  useEffect(() => {
    loadVaccines();
  }, [loadVaccines]);

  const addVaccine = async (vaccineData: Partial<Vaccine>) => {
    const result = await syncService.perform('vaccineService', 'createVaccine', [vaccineData]);
    if (result.success) {
      showToast('Vacina registrada!', 'success');
      loadVaccines(true);
      return result;
    }
    showToast(result.error || 'Erro ao registrar vacina.', 'error');
    return result;
  };

  const updateVaccine = async (id: string, updates: Partial<Vaccine>) => {
    const result = await syncService.perform('vaccineService', 'updateVaccine', [id, updates]);
    if (result.success) {
      showToast('Vacina atualizada!', 'success');
      loadVaccines(true);
      return result;
    }
    showToast(result.error || 'Erro ao atualizar vacina.', 'error');
    return result;
  };

  const deleteVaccine = async (id: string) => {
    const result = await syncService.perform('vaccineService', 'deleteVaccine', [id]);
    if (result.success) {
      showToast('Vacina removida!', 'success');
      loadVaccines(true);
      return result;
    }
    showToast(result.error || 'Erro ao remover vacina.', 'error');
    return result;
  };

  return {
    vaccines,
    loading,
    refreshing,
    refresh: () => loadVaccines(true),
    addVaccine,
    updateVaccine,
    deleteVaccine
  };
};

