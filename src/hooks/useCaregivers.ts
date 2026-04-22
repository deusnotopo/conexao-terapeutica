import { useState, useCallback, useEffect, useRef } from 'react';
import { caregiverService, CaregiverAccess, CaregiverInvite } from '../services/caregiverService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { webAlert } from '../lib/webAlert';

/**
 * useCaregivers Hook (Nível Akita — TypeScript)
 * Abstrai a gestão de acessos e convites com resiliência offline.
 * 
 * Bug fixed: getCaregivers/getInvites return Result<T>, so we must 
 * unpack .data — old code set state to the Result object directly.
 */
export const useCaregivers = (dependentId: string) => {
  const [caregivers, setCaregivers] = useState<CaregiverAccess[]>([]);
  const [invites, setInvites] = useState<CaregiverInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    if (!dependentId) return;
    setLoading(true);
    try {
      const [careResult, invResult] = await Promise.all([
        caregiverService.getCaregivers(dependentId),
        caregiverService.getInvites(dependentId),
      ]);
      // Unpack Result<T> correctly
      if (careResult.success && careResult.data) setCaregivers(careResult.data);
      if (invResult.success && invResult.data) setInvites(invResult.data);

      if (!careResult.success || !invResult.success) {
        showToast('Erro ao carregar cuidadores.', 'error');
      }
    } catch {
      if (isMounted.current) showToast('Erro ao carregar cuidadores.', 'error');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [dependentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const sendInvite = async (inviteData: Partial<CaregiverInvite>) => {
    const result = await syncService.perform('caregiverService', 'sendInvite', [
      { ...inviteData, dependent_id: dependentId }
    ]);

    if (result.success) {
      if (result.metadata?.enqueued) {
        showToast('Convite enfileirado offline.', 'info');
      } else {
        showToast('Convite enviado!', 'success');
        if (result.data) setInvites(prev => [result.data, ...prev]);
      }
      return { success: true, data: result.data };
    } else {
      webAlert('Erro ao convidar', result.error || 'Falha ao enviar convite');
      return { success: false, error: result.error };
    }
  };

  const revokeAccess = async (accessId: string) => {
    const result = await syncService.perform('caregiverService', 'revokeAccess', [accessId]);
    if (result.success) {
      setCaregivers(prev => prev.filter(c => c.id !== accessId));
      if (result.metadata?.enqueued) {
        showToast('Revogação enfileirada.', 'info');
      } else {
        showToast('Acesso removido.', 'success');
      }
      return true;
    }
    return false;
  };

  const revokeInvite = async (inviteId: string) => {
    const result = await syncService.perform('caregiverService', 'revokeInvite', [inviteId]);
    if (result.success) {
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      if (result.metadata?.enqueued) {
        showToast('Cancelamento enfileirado.', 'info');
      } else {
        showToast('Convite cancelado.', 'success');
      }
      return true;
    }
    return false;
  };

  return {
    caregivers,
    invites,
    loading,
    refreshing,
    refresh,
    sendInvite,
    revokeAccess,
    revokeInvite,
  };
};
