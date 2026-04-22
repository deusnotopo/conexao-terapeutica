import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { Result } from '../lib/result';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const CaregiverAccessSchema = z.object({
  id: z.string().optional(),
  dependent_id: z.string().uuid(),
  caregiver_id: z.string().uuid(),
  access_level: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
});

export const CaregiverInviteSchema = z.object({
  id: z.string().optional(),
  dependent_id: z.string().uuid(),
  invited_by: z.string().uuid(),
  invited_email: z.string().email('E-mail inválido'),
  status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
});

export type CaregiverAccess = z.infer<typeof CaregiverAccessSchema>;
export type CaregiverInvite = z.infer<typeof CaregiverInviteSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Serviço de Gestão de Cuidadores (Nível Akita — TypeScript)
 */
export const caregiverService = {
  /**
   * Lista cuidadores com acesso a um dependente.
   */
  async getCaregivers(dependentId: string): Promise<Result<CaregiverAccess[]>> {
    try {
      const { data, error } = await supabase
        .from('caregiver_access')
        .select('*, profiles:caregiver_id(full_name, id)')
        .eq('dependent_id', dependentId);

      if (error) return Result.fail(error.message);

      const validated = z.array(CaregiverAccessSchema).safeParse(data || []);
      if (!validated.success) return Result.fail('Erro de integridade nos dados de cuidadores.');

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar cuidadores');
    }
  },

  /**
   * Lista convites pendentes/enviados para um dependente.
   */
  async getInvites(dependentId: string): Promise<Result<CaregiverInvite[]>> {
    try {
      const { data, error } = await supabase
        .from('caregiver_invites')
        .select('*')
        .eq('dependent_id', dependentId)
        .order('created_at', { ascending: false });

      if (error) return Result.fail(error.message);

      const validated = z.array(CaregiverInviteSchema).safeParse(data || []);
      if (!validated.success) return Result.fail('Erro de integridade nos dados de convites.');

      return Result.ok(validated.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao buscar convites');
    }
  },

  /**
   * Envia um convite (Cria registro no banco).
   */
  async sendInvite(inviteData: Partial<CaregiverInvite>): Promise<Result<CaregiverInvite>> {
    try {
      const validated = CaregiverInviteSchema.safeParse({
        ...inviteData,
        status: 'pending',
      });

      if (!validated.success) {
        return Result.fail(validated.error.issues[0].message);
      }

      const { data, error } = await supabase
        .from('caregiver_invites')
        .insert([validated.data])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return Result.fail('Convite já enviado para este e-mail.');
        }
        return Result.fail(error.message);
      }

      const parsedResult = CaregiverInviteSchema.safeParse(data);
      if (!parsedResult.success) return Result.fail('Convite criado mas com erro de contrato.');

      return Result.ok(parsedResult.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao enviar convite');
    }
  },

  /**
   * Remove acesso de um cuidador.
   */
  async revokeAccess(accessId: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('caregiver_access')
        .delete()
        .eq('id', accessId);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao revogar acesso');
    }
  },

  /**
   * Cancela/Remove um convite.
   */
  async revokeInvite(inviteId: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('caregiver_invites')
        .delete()
        .eq('id', inviteId);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao cancelar convite');
    }
  },

  /**
   * Aceita um convite.
   */
  async acceptInvite(inviteId: string): Promise<Result<CaregiverInvite>> {
    try {
      const { data, error } = await supabase
        .from('caregiver_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const parsedResult = CaregiverInviteSchema.safeParse(data);
      if (!parsedResult.success) return Result.fail('Convite aceito mas com erro de contrato.');

      return Result.ok(parsedResult.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao aceitar convite');
    }
  },
};
