import { useState, useEffect, useCallback, useRef } from 'react';
import { medicationService } from '../services/medicationService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';
import { notificationService } from '../services/notificationService';
import { Medication } from '../lib/schemas';
import { Result } from '../lib/result';

/**
 * useMedications Hook
 * Encapsulates the logic for fetching and managing medication records.
 */
export const useMedications = (activeDependentId: string) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async (isSilent: boolean = false) => {
    if (!activeDependentId) return;

    if (!isSilent) setLoading(true);

    const processResults = (res: Result<Medication[]>) => {
      if (res.success && res.data) {
        setMedications(res.data);
        notificationService.syncMedicationReminders(res.data);
      }
    };

    // 1. Try Cache
    const cachedResult = await medicationService.getMedications(activeDependentId);
    if (cachedResult.success) {
      setMedications(cachedResult.data!);
      processResults(cachedResult);
      if ((cachedResult.metadata as { fromCache?: boolean })?.fromCache) {
        setLoading(false);
      }
    }

    // 2. Background Refresh
    const freshResult = await medicationService.getMedications(activeDependentId, { forceRefresh: true });
    
    if (freshResult.success) {
      processResults(freshResult);
    } else if (!cachedResult.success) {
      webAlert('Erro', freshResult.error || 'Erro ao carregar dados');
    }

    if (!isMounted.current) return;
    setLoading(false);
    setRefreshing(false);
  }, [activeDependentId]);

  useEffect(() => {
    fetchData();
  }, [activeDependentId, fetchData]);

  const refresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const addMedication = async (medicationData: Partial<Medication>) => {
    const result = await syncService.perform('medicationService', 'createMedication', [medicationData]);
    if (result.success) {
      showToast('Medicamento adicionado!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao adicionar medicamento.', 'error');
    return result;
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    const result = await syncService.perform('medicationService', 'updateMedication', [id, updates]);
    if (result.success) {
      showToast('Medicamento atualizado!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao atualizar medicamento.', 'error');
    return result;
  };

  const logTaken = async (medicationId: string, notes: string | null = null) => {
    const result = await syncService.perform('medicationService', 'logTaken', [medicationId, notes]);
    if (result.success) {
      showToast('Dose registrada!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao registrar dose.', 'error');
    return result;
  };

  const updateStock = async (medId: string, nextCount: number) => {
    const result = await syncService.perform('medicationService', 'updateStock', [medId, nextCount]);
    if (result.success) {
      setMedications((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, stock_count: nextCount } : m))
      );
      if ((result.metadata as { enqueued?: boolean })?.enqueued) showToast('Salvo offline.');
      return result;
    } else {
      showToast(result.error || 'Erro ao atualizar estoque.', 'error');
      return result;
    }
  };

  const toggleActive = async (medId: string, isActive: boolean) => {
    const result = await syncService.perform('medicationService', 'toggleActive', [medId, isActive]);
    if (result.success) {
      setMedications((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, is_active: isActive } : m))
      );
      if ((result.metadata as { enqueued?: boolean })?.enqueued) showToast('Salvo offline.');
      return result;
    } else {
      showToast(result.error || 'Erro ao alterar status.', 'error');
      return result;
    }
  };

  const deleteMedication = async (medId: string) => {
    // webAlert handles the confirmation logic internally on web/native
    const result = await syncService.perform('medicationService', 'deleteMedication', [medId]);
    if (result.success) {
      setMedications((prev) => {
        const updated = prev.filter((m) => m.id !== medId);
        notificationService.syncMedicationReminders(updated);
        return updated;
      });
      showToast('Medicamento removido.', 'success');
      return result;
    } else {
      showToast(result.error || 'Erro ao excluir.', 'error');
      return result;
    }
  };

  return {
    medications,
    loading,
    refreshing,
    refresh,
    addMedication,
    updateMedication,
    logTaken,
    updateStock,
    toggleActive,
    deleteMedication,
  };
};

