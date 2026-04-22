import { useState, useCallback, useEffect, useRef } from 'react';
import { wellbeingService } from '../services/wellbeingService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { CaregiverWellbeing } from '../lib/schemas';

const TIPS = [
  'Cuidar de si mesmo é tão importante quanto cuidar de quem você ama. Você merece descanso. 🤍',
  'Você carrega uma carga enorme com tanto amor. Isso faz de você uma pessoa extraordinária. ⭐',
  'Não existe cuidador perfeito. Existem cuidadores que tentam todo dia — você é um deles. 💚',
  'Peça ajuda quando precisar. Isso é sabedoria, não fraqueza. 🌟',
  'Lembre-se: avião pede para você colocar sua máscara primeiro. Cuide de você. ✈️',
];

/**
 * useWellbeing Hook (Akita Mode)
 * Abstraction for caregiver wellbeing monitoring with offline-first support.
 */
export const useWellbeing = (userId: string) => {
  const [wellbeing, setWellbeing] = useState<CaregiverWellbeing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const isMounted = useRef(true);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = wellbeing.find((e) => e.date === today);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadLogs = useCallback(async (forceRefresh: boolean = false) => {
    if (!userId) return;
    
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    const result = await wellbeingService.getWellbeingLogs(userId, 0, 20, { forceRefresh });
    
    if (!isMounted.current) return;

    if (forceRefresh) setRefreshing(false);
    else setLoading(false);

    if (result.success && result.data) {
      // Paginated response — unpack the data array
      setWellbeing(result.data.data);
    } else {
      showToast('Erro ao carregar registros de bem-estar.', 'error');
    }
  }, [userId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /**
   * Complex Logic Decoupling: Decide whether to add or update based on today's entry.
   */
  const saveWellbeing = async (data: Partial<CaregiverWellbeing>) => {
    const payload = { ...data, user_id: userId };
    const method = todayEntry ? 'updateWellbeingLog' : 'createWellbeingLog';
    const args = todayEntry ? [todayEntry.id, payload] : [payload];

    const result = await syncService.perform('wellbeingService', method, args);
    
    if (result.success) {
      showToast(todayEntry ? 'Status atualizado!' : 'Status de bem-estar salvo!', 'success');
      loadLogs(true);
      return result;
    }
    
    showToast(result.error || 'Erro ao salvar status.', 'error');
    return result;
  };

  const deleteLog = async (id: string) => {
    const result = await syncService.perform('wellbeingService', 'deleteWellbeingLog', [id]);
    if (result.success) {
      showToast('Status removido!', 'success');
      loadLogs(true);
      return result;
    }
    showToast(result.error || 'Erro ao remover status.', 'error');
    return result;
  };

  return {
    wellbeing,
    loading,
    refreshing,
    tip,
    todayEntry,
    today,
    saveWellbeing,
    deleteLog,
    refresh: () => loadLogs(true),
  };
};
