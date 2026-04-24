import { useState, useEffect, useCallback, useRef } from 'react';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { medicationService } from '../services/medicationService';
import { webAlert } from '../lib/webAlert';
import { Medication, MedicationLog } from '../lib/schemas';

export type MedicationMonthStat = {
  label: string;
  taken: number;
  skipped: number;
  total: number;
  pct: number | null;
};

export type MedicationAdherenceStat = {
  med: Medication;
  byMonth: MedicationMonthStat[];
  overallPct: number | null;
  allTaken: number;
  allSkipped: number;
  allTotal: number;
};

/**
 * useMedicationAdherence Hook (TypeScript)
 * Handles the logic for calculating medication adherence stats.
 */
export const useMedicationAdherence = (activeDependentId: string) => {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
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
    try {
      const threeMonthsAgo = subMonths(new Date(), 3).toISOString();
      
      const [medsRes, logsRes] = await Promise.all([
        medicationService.getMedications(activeDependentId),
        medicationService.getHistoricalLogs(activeDependentId, threeMonthsAgo),
      ]);

      // Null-guard on data before setting state
      if (medsRes.success && medsRes.data) setMedications(medsRes.data);
      if (logsRes.success && logsRes.data) setLogs(logsRes.data);

      if (!medsRes.success || !logsRes.success) {
        webAlert('Aviso', 'Alguns dados não puderam ser carregados completamente.');
      }
    } catch {
      webAlert('Erro', 'Falha ao processar estatísticas.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeDependentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const months = [0, 1, 2].map((i) => {
    const d = subMonths(new Date(), i);
    const start = startOfMonth(d).toISOString();
    const end = endOfMonth(d).toISOString();
    const label = format(d, 'MMM/yy', { locale: ptBR });
    return { label, start, end };
  });

  const statsByMed: MedicationAdherenceStat[] = medications
    .filter((m) => m.is_active)
    .map((med) => {
      const medLogs = logs.filter((l) => l.medication_id === med.id);
      
      const byMonth: MedicationMonthStat[] = months.map((m) => {
        const monthLogs = medLogs.filter(
          (l) => {
            const dateStr = l.taken_at ?? l.scheduled_for ?? '';
            return dateStr >= m.start && dateStr <= m.end;
          }
        );
        
        const taken = monthLogs.filter((l) => l.status === 'taken').length;
        const skipped = monthLogs.filter((l) => l.status === 'missed' || l.status === 'late').length;
        const total = taken + skipped;
        const pct = total > 0 ? Math.round((taken / total) * 100) : null;

        return { label: m.label, taken, skipped, total, pct };
      });

      const allTaken = medLogs.filter((l) => l.status === 'taken').length;
      const allSkipped = medLogs.filter((l) => l.status === 'missed' || l.status === 'late').length;
      const allTotal = allTaken + allSkipped;
      const overallPct = allTotal > 0 ? Math.round((allTaken / allTotal) * 100) : null;

      return { med, byMonth, overallPct, allTaken, allSkipped, allTotal };
    });

  return {
    statsByMed,
    loading,
    refreshing,
    refresh,
  };
};
