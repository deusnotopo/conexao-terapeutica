import { useState, useCallback, useEffect, useRef } from 'react';
import { therapyService } from '../services/therapyService';
import { webAlert } from '../lib/webAlert';
import { TherapyNote } from '../lib/schemas';

/**
 * useTherapyNotes Hook (TypeScript)
 * Encapsulates the logic for fetching therapy evolution records.
 */
export const useTherapyNotes = (activeDependentId: string) => {
  const [notes, setNotes] = useState<TherapyNote[]>([]);
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
    const cacheResult = await therapyService.getNotes(activeDependentId, { forceRefresh: false });
    if (cacheResult.success && cacheResult.data && (cacheResult.metadata as { fromCache?: boolean })?.fromCache) {
      setNotes(cacheResult.data);
      setLoading(false); // Early interactive state
    }

    // 2. Fetch Network
    const networkResult = await therapyService.getNotes(activeDependentId, { forceRefresh: true });

    if (networkResult.success && networkResult.data) {
      setNotes(networkResult.data);
    } else if (notes.length === 0) {
      webAlert('Erro no Prontuário', networkResult.error || 'Falha ao carregar notas de terapia');
    }

    if (!isMounted.current) return;
    setLoading(false);
    setRefreshing(false);
  }, [activeDependentId, notes.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return {
    notes,
    loading,
    refreshing,
    refresh,
  };
};
