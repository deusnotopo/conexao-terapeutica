import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { Event } from '../lib/schemas';
import { storage } from '../lib/storage';

export type DashboardStats = {
  eventsToday: number;
  newDocs: number;
  activeGoals: number;
  medsToday: number;
};

export type DashboardMetrics = {
  nextEvent: Event | null;
  stats: DashboardStats;
};

export const metricsService = {
  async fetchDashboardMetrics(
    dependentId: string,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<DashboardMetrics>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `dashboard_metrics:${dependentId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const now = new Date().toISOString();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [nextEventRes, eventsTodayRes, newDocsRes, goalsRes, medsRes] =
        await Promise.all([
          supabase
            .from('events')
            .select('*')
            .eq('dependent_id', dependentId)
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .limit(1)
            .single(),
          supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('dependent_id', dependentId)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString()),
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('dependent_id', dependentId)
            .gte('uploaded_at', sevenDaysAgo),
          supabase
            .from('therapeutic_goals')
            .select('*', { count: 'exact', head: true })
            .eq('dependent_id', dependentId)
            .in('status', ['pending', 'in_progress']),
          supabase
            .from('medications')
            .select('*', { count: 'exact', head: true })
            .eq('dependent_id', dependentId)
            .eq('is_active', true),
        ]);

      const nextEvent = nextEventRes.error ? null : (nextEventRes.data as Event);

      const metricsData: DashboardMetrics = {
        nextEvent,
        stats: {
          eventsToday: eventsTodayRes.count || 0,
          newDocs: newDocsRes.count || 0,
          activeGoals: goalsRes.count || 0,
          medsToday: medsRes.count || 0,
        },
      };

      await storage.setItem(cacheKey, metricsData);
      return Result.ok(metricsData);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar métricas do dashboard');
    }
  },
};
