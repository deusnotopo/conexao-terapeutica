import { useState, useCallback, useEffect, useRef } from 'react';
import { diaryService } from '../services/diaryService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { ParentDiary } from '../lib/schemas';

/**
 * useDiary Hook (Akita Mode — TypeScript)
 * Abstraction for parent diary with offline-first support.
 * 
 * Bug fixed: getDiaryEntries returns paginated {data, count} —
 * this hook correctly unpacks the .data array for state.
 */
export const useDiary = (userId: string, dependentId: string) => {
  const [entries, setEntries] = useState<ParentDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadEntries = useCallback(async (forceRefresh: boolean = false) => {
    if (!userId || !dependentId) return;
    
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    const result = await diaryService.getDiaryEntries(dependentId, 0, 20, { forceRefresh });
    
    if (!isMounted.current) return;

    if (forceRefresh) setRefreshing(false);
    else setLoading(false);

    if (result.success && result.data) {
      // Paginated response — unpack the data array
      setEntries(result.data.data);
    } else {
      showToast('Erro ao carregar diário.', 'error');
    }
  }, [userId, dependentId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = async (entryData: Partial<ParentDiary>) => {
    const result = await syncService.perform('diaryService', 'createDiaryEntry', [entryData]);
    if (result.success) {
      showToast('Entrada salva no diário!', 'success');
      loadEntries(true);
      return result;
    }
    showToast(result.error || 'Erro ao salvar entrada.', 'error');
    return result;
  };

  const updateEntry = async (id: string, updates: Partial<ParentDiary>) => {
    const result = await syncService.perform('diaryService', 'updateDiaryEntry', [id, updates]);
    if (result.success) {
      showToast('Entrada atualizada!', 'success');
      loadEntries(true);
      return result;
    }
    showToast(result.error || 'Erro ao atualizar entrada.', 'error');
    return result;
  };

  const deleteEntry = async (id: string) => {
    const result = await syncService.perform('diaryService', 'deleteDiaryEntry', [id]);
    if (result.success) {
      showToast('Entrada removida!', 'success');
      loadEntries(true);
      return result;
    }
    showToast(result.error || 'Erro ao remover entrada.', 'error');
    return result;
  };

  return {
    entries,
    loading,
    refreshing,
    refresh: () => loadEntries(true),
    addEntry,
    updateEntry,
    deleteEntry
  };
};
