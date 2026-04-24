import { useState, useEffect, useCallback, useRef } from 'react';
import { medicalRecordService } from '../services/medicalRecordService';
import { syncService } from '../services/syncService';
import { webAlert } from '../lib/webAlert';
import { showToast } from '../components/Toast';
import { MedicalRecord } from '../lib/schemas';

/**
 * useMedicalRecord Hook
 * Encapsulates the logic for fetching and managing medical records.
 */
export const useMedicalRecord = (activeDependentId: string) => {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchRecord = useCallback(async () => {
    if (!activeDependentId) return;

    setLoading(true);
    const result = await medicalRecordService.getByDependentId(activeDependentId);
    
    if (result.success) {
      setRecord(result.data as MedicalRecord);
    } else {
      setRecord(null);
    }
    if (isMounted.current) setLoading(false);
  }, [activeDependentId]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const saveRecord = async (payload: Partial<MedicalRecord>) => {
    const dataToSave = { 
      ...payload, 
      dependent_id: activeDependentId 
    };

    const result = await syncService.perform(
      'medicalRecordService',
      'upsertRecord',
      [dataToSave]
    );

    if (result.success) {
      setRecord(result.data as MedicalRecord);
      if ((result.metadata as { enqueued?: boolean })?.enqueued) {
        showToast('Ficha salva offline.');
      } else {
        showToast('Ficha médica atualizada.');
      }
      return true;
    } else {
      webAlert('Erro ao salvar ficha', result.error || 'Erro desconhecido');
      return false;
    }
  };

  return {
    record,
    loading,
    saveRecord,
    refresh: fetchRecord
  };
};

