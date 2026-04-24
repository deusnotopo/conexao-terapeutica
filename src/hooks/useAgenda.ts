import { useState, useEffect, useCallback, useRef } from 'react';
import { agendaService } from '../services/agendaService';
import { medicationService } from '../services/medicationService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';
import { notificationService } from '../services/notificationService';
import { Event, Medication, MedicationLog, Consultation } from '../lib/schemas';
import { Result } from '../lib/result';

export type MedicationWithStatus = Medication & { taken: boolean };

export function useAgenda(dependentId: string, type: 'upcoming' | 'past' = 'upcoming') {
  const [events, setEvents] = useState<Event[]>([]);
  const [medications, setMedications] = useState<MedicationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async (isSilent: boolean = false) => {
    if (!dependentId) return;
    if (!isSilent) setLoading(true);

    const processResults = (
      eventRes: Result<Event[]>, 
      medRes: Result<Medication[]>, 
      logsRes: Result<MedicationLog[]>
    ) => {
      if (eventRes.success && eventRes.data) {
        setEvents(eventRes.data);
        // Note: notification reminders for consultations are handled by useConsultations,
        // which works with Consultation[] — not general Event types.
      }
      
      if (type === 'upcoming' && medRes.success && medRes.data && logsRes.success && logsRes.data) {
        const takenIds = new Set(logsRes.data.map(l => l.medication_id));
        const activeMeds = medRes.data.filter(m => m.is_active);
        setMedications(activeMeds.map(m => ({
          ...m,
          taken: takenIds.has(m.id)
        })));

        // Sync medication reminders
        notificationService.syncMedicationReminders(activeMeds);
      }
    };

    // 1. Initial Load (Try Cache)
    const [cEvent, cMed, cLogs] = await Promise.all([
      agendaService.getEvents(dependentId, type),
      type === 'upcoming' ? medicationService.getMedications(dependentId) : Promise.resolve(Result.ok<Medication[]>([])),
      type === 'upcoming' ? medicationService.getTodaysLogs(dependentId) : Promise.resolve(Result.ok<MedicationLog[]>([]))
    ]);

    processResults(cEvent, cMed, cLogs);
    
    if ((cEvent.metadata as { fromCache?: boolean })?.fromCache) {
      setLoading(false);
    }

    // 2. Background Refresh (Force network)
    const [fEvent, fMed, fLogs] = await Promise.all([
      agendaService.getEvents(dependentId, type, { forceRefresh: true }),
      type === 'upcoming' ? medicationService.getMedications(dependentId, { forceRefresh: true }) : Promise.resolve(Result.ok<Medication[]>([])),
      type === 'upcoming' ? medicationService.getTodaysLogs(dependentId, { forceRefresh: true }) : Promise.resolve(Result.ok<MedicationLog[]>([]))
    ]);

    processResults(fEvent, fMed, fLogs);

    if (!isMounted.current) return;

    setLoading(false);
    setRefreshing(false);
  }, [dependentId, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const deleteEvent = async (id: string) => {
    const result = await syncService.perform('agendaService', 'deleteEvent', [id]);
    if (result.success) {
      setEvents(prev => prev.filter(e => e.id !== id));
      showToast('Compromisso removido.', 'success');
      return result;
    }
    showToast(result.error || 'Erro ao remover compromisso.', 'error');
    return result;
  };

  const addEvent = async (data: Partial<Event>) => {
    const result = await syncService.perform('agendaService', 'createEvent', [data]);
    if (result.success) {
      showToast('Compromisso agendado!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao agendar compromisso.', 'error');
    return result;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const result = await syncService.perform('agendaService', 'updateEvent', [id, updates]);
    if (result.success) {
      showToast('Compromisso atualizado!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao atualizar compromisso.', 'error');
    return result;
  };

  const addConsultation = async (data: Partial<Consultation>) => {
    const result = await syncService.perform('agendaService', 'createConsultation', [data]);
    if (result.success) {
      showToast('Consulta registrada!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao registrar consulta.', 'error');
    return result;
  };

  const updateConsultation = async (id: string, updates: Partial<Consultation>) => {
    const result = await syncService.perform('agendaService', 'updateConsultation', [id, updates]);
    if (result.success) {
      showToast('Consulta atualizada!', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao atualizar consulta.', 'error');
    return result;
  };

  const deleteConsultation = async (id: string) => {
    // webAlert handles its own confirm logic on web
    const result = await syncService.perform('agendaService', 'deleteConsultation', [id]);
    if (result.success) {
      showToast('Consulta removida.', 'success');
      refresh();
      return result;
    }
    showToast(result.error || 'Erro ao remover consulta.', 'error');
    return result;
  };

  const logMedication = async (medicationId: string) => {
    const result = await syncService.perform('medicationService', 'logTaken', [medicationId]);
    if (result.success) {
      setMedications(prev => prev.map(m => 
        m.id === medicationId ? { ...m, taken: true } : m
      ));
      if ((result.metadata as { enqueued?: boolean })?.enqueued) showToast('Registro agendado offline.');
      return true;
    } else {
      webAlert('Erro ao registrar', result.error || 'Erro desconhecido');
      return false;
    }
  };

  return {
    events,
    medications,
    loading,
    refreshing,
    refresh,
    addEvent,
    updateEvent,
    deleteEvent,
    addConsultation,
    updateConsultation,
    deleteConsultation,
    logMedication,
  };
}
