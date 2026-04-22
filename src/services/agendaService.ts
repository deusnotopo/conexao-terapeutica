import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { 
  EventSchema, 
  EventListSchema, 
  ConsultationSchema, 
  PaginatedConsultationSchema,
  EventCreateSchema,
  EventUpdateSchema,
  ConsultationCreateSchema,
  ConsultationUpdateSchema,
  Event,
  Consultation,
  PaginatedResponse
} from '../lib/schemas';
import { storage } from '../lib/storage';

export const agendaService = {
  /**
   * Fetch events for a dependent.
   */
  async getEvents(
    dependentId: string, 
    type: 'upcoming' | 'past' = 'upcoming', 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<Event[]>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `events:${dependentId}:${type}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const now = new Date().toISOString();
      let query = supabase
        .from('events')
        .select('*')
        .eq('dependent_id', dependentId);

      if (type === 'upcoming') {
        query = query.gte('start_time', now).order('start_time', { ascending: true });
      } else {
        query = query.lt('start_time', now).order('start_time', { ascending: false });
      }

      const { data, error } = await query;
      if (error) return Result.fail(error.message);

      const validated = EventListSchema.safeParse(data || []);
      if (!validated.success) return Result.fail('Erro de integridade nos dados da agenda.');

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao carregar agenda');
    }
  },

  /**
   * Fetch paginated consultations.
   */
  async getConsultations(
    dependentId: string, 
    page: number = 1, 
    pageSize: number = 10, 
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<PaginatedResponse<Consultation>>> {
    if (!dependentId) return Result.fail('ID do dependente não fornecido.');

    const cacheKey = `consultations:${dependentId}:p${page}`;
    try {
      if (!options.forceRefresh && page === 1) { // Cache only first page
        const cached = await storage.getItem<any>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('consultations')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('date', { ascending: false })
        .range(from, to);

      if (error) return Result.fail(error.message);

      const validated = PaginatedConsultationSchema.safeParse({ data: data || [], count: count || 0 });
      if (!validated.success) return Result.fail('Erro de integridade nos dados de consultas.');
      
      if (page === 1) {
        await storage.setItem(cacheKey, validated.data);
      }

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao carregar consultas');
    }
  },

  /**
   * Create a new event.
   */
  async createEvent(eventData: Partial<Event>): Promise<Result<Event>> {
    try {
      const validatedCreate = EventCreateSchema.safeParse(eventData);
      if (!validatedCreate.success) {
        return Result.fail(`Dados do evento inválidos: ${validatedCreate.error.issues[0].message}`);
      }
      
      const { data, error } = await supabase
        .from('events')
        .insert([validatedCreate.data])
        .select()
        .single();
      
      if (error) return Result.fail(error.message);

      const validated = EventSchema.safeParse(data);
      if (!validated.success) return Result.fail('Evento criado mas com erro de contrato.');

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao salvar compromisso');
    }
  },

  /**
   * Update an existing event.
   */
  async updateEvent(id: string, updates: Partial<Event>): Promise<Result<Event>> {
    try {
      const validatedUpdate = EventUpdateSchema.safeParse(updates);
      if (!validatedUpdate.success) {
        return Result.fail(`Atualização inválida: ${validatedUpdate.error.issues[0].message}`);
      }

      const { data, error } = await supabase
        .from('events')
        .update(validatedUpdate.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = EventSchema.safeParse(data);
      if (!validated.success) return Result.fail('Evento atualizado mas com erro de contrato.');

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao atualizar evento');
    }
  },

  /**
   * Delete an event.
   */
  async deleteEvent(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao excluir evento');
    }
  },

  /**
   * Create a new consultation record.
   */
  async createConsultation(consultationData: Partial<Consultation>): Promise<Result<Consultation>> {
    try {
      const validatedCreate = ConsultationCreateSchema.safeParse(consultationData);
      if (!validatedCreate.success) {
        return Result.fail(`Dados da consulta inválidos: ${validatedCreate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('consultations')
        .insert([validatedCreate.data])
        .select()
        .single();
      
      if (error) return Result.fail(error.message);

      const validated = ConsultationSchema.safeParse(data);
      if (!validated.success) return Result.fail('Consulta criada mas com erro de contrato.');

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao criar consulta');
    }
  },

  /**
   * Update an existing consultation record.
   */
  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Result<Consultation>> {
    try {
      const validatedUpdate = ConsultationUpdateSchema.safeParse(updates);
      if (!validatedUpdate.success) {
        return Result.fail(`Atualização inválida: ${validatedUpdate.error.issues[0].message}`);
      }
      const { data, error } = await supabase
        .from('consultations')
        .update(validatedUpdate.data)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = ConsultationSchema.safeParse(data);
      if (!validated.success) return Result.fail('Consulta atualizada mas com erro de contrato.');

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao atualizar consulta');
    }
  },

  /**
   * Delete a consultation record.
   */
  async deleteConsultation(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase.from('consultations').delete().eq('id', id);
      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Falha ao excluir consulta');
    }
  }
};

