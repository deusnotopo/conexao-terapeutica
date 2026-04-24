import { storage } from '../lib/storage';
import { Result } from '../lib/result';
import NetInfo from '@react-native-community/netinfo';
import { medicationService } from './medicationService';
import { agendaService } from './agendaService';
import { crisisService } from './crisisService';
import { expenseService } from './expenseService';
import { professionalService } from './professionalService';
import { goalService } from './goalService';
import { sleepService } from './sleepService';
import { vaccineService } from './vaccineService';
import { wellbeingService } from './wellbeingService';
import { diaryService } from './diaryService';
import { growthService } from './growthService';
import { notificationService } from './notificationService';
import { documentService } from './documentService';
import { storageService } from './storageService';
import { profileService } from './profileService';
import { dependentService } from './dependentService';
import { medicalRecordService } from './medicalRecordService';
import { caregiverService } from './caregiverService';
import { createLogger } from '../shared/types';

const logger = createLogger('SyncService');

const QUEUE_KEY = 'sync_mutation_queue';

interface Mutation {
  id: string;
  serviceName: string;
  methodName: string;
  args: unknown[];
  timestamp: string;
  retryCount: number;
  nextRetry: string | null;
}

type ServiceRegistry = {
  [key: string]: Record<string, Function>;
};

// Map of services for dynamic dispatch
const SERVICES: ServiceRegistry = {
  medicationService,
  agendaService,
  crisisService,
  expenseService,
  professionalService,
  goalService,
  sleepService,
  vaccineService,
  wellbeingService,
  diaryService,
  growthService,
  documentService,
  storageService,
  profileService,
  dependentService,
  medicalRecordService,
  caregiverService
};

/**
 * Sync Service (Akita mode)
 * Manages a queue of pending mutations to be synchronized with the backend.
 * Provides resilience for offline operations.
 */
export const syncService = {
  /**
   * Get the current queue.
   */
  async getQueue(): Promise<Mutation[]> {
    return (await storage.getItem(QUEUE_KEY)) || [];
  },

  /**
   * Add a mutation to the queue.
   */
  async enqueue(serviceName: string, methodName: string, args: unknown[]): Promise<string> {
    const queue = await this.getQueue();
    const mutation: Mutation = {
      id: Math.random().toString(36).substring(7),
      serviceName,
      methodName,
      args,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      nextRetry: null
    };
    
    queue.push(mutation);
    await storage.setItem(QUEUE_KEY, queue);
    return mutation.id;
  },

  /**
   * Remove a mutation from the queue.
   */
  async dequeue(mutationId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(m => m.id !== mutationId);
    await storage.setItem(QUEUE_KEY, filtered);
  },

  /**
   * Update a mutation in the queue (e.g. for retry info).
   */
  async updateMutation(mutationId: string, updates: Partial<Mutation>): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(m => m.id === mutationId);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await storage.setItem(QUEUE_KEY, queue);
    }
  },

  /**
   * Process all pending mutations in the queue.
   */
  async processQueue(): Promise<Result<{ successCount: number; failCount: number }>> {
    const queue = await this.getQueue();
    if (queue.length === 0) return Result.ok({ successCount: 0, failCount: 0 });

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      // Abort gracefully to save battery and hide false timeouts
      return Result.ok({ successCount: 0, failCount: queue.length });
    }

    let successCount = 0;
    let failCount = 0;

    const now = Date.now();
    for (const mutation of queue) {
      // Skip if it hasn't reached retry time
      if (mutation.nextRetry && now < new Date(mutation.nextRetry).getTime()) {
        continue;
      }

      try {
        const service = SERVICES[mutation.serviceName];
        if (!service || !service[mutation.methodName]) {
          logger.error(`Target not found: ${mutation.serviceName}.${mutation.methodName}`);
          await this.dequeue(mutation.id);
          continue;
        }

        logger.info(`Sincronizando ${mutation.serviceName}.${mutation.methodName}`);
        const result = await service[mutation.methodName](...mutation.args);

        if (result.success) {
          await this.dequeue(mutation.id);
          successCount++;
        } else {
          const isNonRetryable = result.error && (
            result.error.toString().includes('invalid') || 
            result.error.toString().includes('inválido') ||
            result.error.toString().includes('contrato')
          );

          if (isNonRetryable) {
            logger.error(`Non-retryable error for mutation ${mutation.id}:`, result.error);
            await this.dequeue(mutation.id);
            failCount++;
          } else {
            logger.warn(`Retryable failure for mutation ${mutation.id}:`, result.error);
            // Exponential backoff: 2^retryCount * 5 seconds (starting at 5s, 10s...)
            const retryCount = (mutation.retryCount || 0) + 1;
            const delayMs = Math.min(Math.pow(2, retryCount) * 5000, 3600000); // Max 1 hour
            const nextRetry = new Date(now + delayMs).toISOString();

            await this.updateMutation(mutation.id, { retryCount, nextRetry });
            // Don't increment failCount for things we keep retrying to avoid noisy notifications?
            // Actually, keep it for awareness.
            failCount++;
          }
        }
      } catch (e: unknown) {
        logger.error(`Fatal error processing mutation ${mutation.id}:`, e);
        // On fatal error, we keep it in queue just in case it's a transient VM error
        failCount++;
      }
    }

    if (successCount > 0) {
      notificationService.scheduleOneTimeNotification(
        'Sincronização Concluída',
        `Sucesso: ${successCount} itens sincronizados.`,
        0
      );
    }

    if (failCount > 0) {
      notificationService.scheduleOneTimeNotification(
        'Falha na Sincronização',
        `${failCount} itens falharam. Tentaremos novamente em breve.`,
        0
      );
    }

    return Result.ok({ successCount, failCount });
  },

  /**
   * Perform a mutation immediately or enqueue if it fails/offline.
   */
  async perform(serviceName: string, methodName: string, args: unknown[]): Promise<Result<unknown>> {
    const service = SERVICES[serviceName];
    if (!service) return Result.fail('Serviço não encontrado para sincronização.');

    try {
      const result = await service[methodName](...args);
      
      if (result.success) {
        return result;
      }

      // IMPORTANTE: Se o Supabase retornou um erro, provavelmente foi um erro de banco de dados
      // (ex: RLS, Restrição Única, Schema).
      // Erros de indisponibilidade de internet costumam ter 'fetch', 'network', 'offline', 'timeout'.
      const errorMessage = result.error ? result.error.toString().toLowerCase() : '';
      
      const isNetworkError = 
        errorMessage.includes('fetch') || 
        errorMessage.includes('network') || 
        errorMessage.includes('offline') || 
        errorMessage.includes('timeout');

      // Se não for um erro claro de rede, é um erro duro (Non-Retryable) e a UI deve saber imediatamente!
      if (!isNetworkError) {
        return result; // Retorna a Falha real pra UI exibir
      }

      // Apenas enfileira se for erro de rede/timeout explícito
      await this.enqueue(serviceName, methodName, args);
      return Result.ok(null, { enqueued: true, message: 'Operação salva offline.' });
    } catch (e: unknown) {
      // Se a biblioteca do supabase CRASHOU por falta de net, cai aqui
      await this.enqueue(serviceName, methodName, args);
      return Result.ok(null, { enqueued: true, message: 'Operação salva offline (erro fatal).' });
    }
  }
};
