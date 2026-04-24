import { useState, useEffect, useCallback, useRef } from 'react';
import { professionalService } from '../services/professionalService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';
import { Professional } from '../lib/schemas';

export function useProfessionals(dependentId: string) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchProfessionals = useCallback(async (isSilent: boolean = false) => {
    if (!dependentId) return;
    if (!isSilent) setLoading(true);

    // 1. Try Cache
    const cachedResult = await professionalService.getByDependent(dependentId);
    if (cachedResult.success && cachedResult.data) {
      setProfessionals(cachedResult.data);
      if ((cachedResult.metadata as { fromCache?: boolean })?.fromCache) {
        setLoading(false);
      }
    }

    // 2. Background Refresh
    const freshResult = await professionalService.getByDependent(dependentId, { forceRefresh: true });
    
    if (freshResult.success && freshResult.data) {
      setProfessionals(freshResult.data);
    } else if (!cachedResult.success) {
      webAlert('Erro', freshResult.error || 'Falha ao carregar profissionais');
    }
    
    if (!isMounted.current) return;
    setLoading(false);
    setRefreshing(false);
  }, [dependentId]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const refresh = () => {
    setRefreshing(true);
    fetchProfessionals(true);
  };

  const addProfessional = async (data: Partial<Professional>) => {
    const result = await syncService.perform('professionalService', 'create', [data]);
    if (result.success) {
      if ((result.metadata as { enqueued?: boolean })?.enqueued) {
        showToast('Profissional cadastrado offline!', 'info');
      } else {
        showToast('Profissional cadastrado!', 'success');
      }
      fetchProfessionals(true);
    }
    return result;
  };

  const updateProfessional = async (id: string, data: Partial<Professional>) => {
    const result = await syncService.perform('professionalService', 'update', [id, data]);
    if (result.success) {
      if ((result.metadata as { enqueued?: boolean })?.enqueued) {
        showToast('Alterações salvas offline!', 'info');
      } else {
        showToast('Profissional atualizado!', 'success');
      }
      fetchProfessionals(true);
    }
    return result;
  };

  const deleteProfessional = async (id: string) => {
    const result = await syncService.perform('professionalService', 'delete', [id]);
    if (result.success) {
      setProfessionals(prev => prev.filter(p => p.id !== id));
      if ((result.metadata as { enqueued?: boolean })?.enqueued) {
        showToast('Exclusão agendada offline.', 'info');
      } else {
        showToast('Profissional removido.', 'success');
      }
      return { success: true };
    }
    return result;
  };

  const togglePrimary = async (professional: Professional) => {
    const nextValue = !professional.is_primary;
    const result = await syncService.perform('professionalService', 'update', [professional.id, { is_primary: nextValue }]);
    
    if (result.success) {
      setProfessionals(prev => 
        prev.map(p => p.id === professional.id ? { ...p, is_primary: nextValue } : p)
      );
      if ((result.metadata as { enqueued?: boolean })?.enqueued) showToast('Alteração salva offline.', 'info');
    } else {
      webAlert('Erro', result.error || 'Falha ao atualizar profissional');
    }
  };

  return {
    professionals,
    loading,
    refreshing,
    refresh,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    togglePrimary,
  };
}
