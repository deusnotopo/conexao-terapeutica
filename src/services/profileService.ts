import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { Profile, ProfileSchema, ProfileUpdateSchema } from '../lib/schemas';
import { storage } from '../lib/storage';

/**
 * Profile Service (Akita Mode — TypeScript)
 * Handles user profile data with strict type validation and caching.
 */
export const profileService = {
  /**
   * Fetch user profile.
   */
  async getProfile(
    userId: string,
    options: { forceRefresh?: boolean } = { forceRefresh: false }
  ): Promise<Result<Profile>> {
    if (!userId) return Result.fail('ID do usuário não fornecido.');

    const cacheKey = `profile:${userId}`;
    try {
      if (!options.forceRefresh) {
        const cached = await storage.getItem<Profile>(cacheKey);
        if (cached) return Result.ok(cached, { fromCache: true });
      }

      let res = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      let data = res.data;

      if (res.error) {
        if (res.error.code === 'PGRST116') {
          console.warn('⚠️ Perfil Ausente (PGRST116). Executando Auto-Heal...');
          const healRes = await supabase.from('profiles').upsert({ id: userId }).select().single();
          if (healRes.error) return Result.fail(healRes.error.message);
          data = healRes.data;
        } else {
          return Result.fail(res.error.message);
        }
      }

      const validated = ProfileSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados do perfil inválidos.');
      }

      await storage.setItem(cacheKey, validated.data);
      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar perfil';
      return Result.fail(msg);
    }
  },

  /**
   * Update profile data.
   */
  async updateProfile(userId: string, profileData: Partial<Profile>): Promise<Result<Profile>> {
    if (!userId) return Result.fail('ID do usuário não fornecido.');
    
    try {
      const validatedUpdates = ProfileUpdateSchema.safeParse(profileData);
      if (!validatedUpdates.success) {
        return Result.fail(`Atualização inválida: ${validatedUpdates.error.issues[0].message}`);
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(validatedUpdates.data)
        .eq('id', userId)
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const validated = ProfileSchema.safeParse(data);
      if (!validated.success) {
        return Result.fail('Dados do perfil atualizados são inválidos.');
      }

      const cacheKey = `profile:${userId}`;
      await storage.setItem(cacheKey, validated.data);
      
      return Result.ok(validated.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar perfil';
      return Result.fail(msg);
    }
  },

  /**
   * Upload and set profile avatar.
   */
  async uploadAvatar(userId: string, fileBody: File | Blob, fileExt: string): Promise<Result<Profile>> {
    if (!userId) return Result.fail('ID do usuário não fornecido.');

    const filePath = `avatars/${userId}.${fileExt}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileBody, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) return Result.fail(uploadError.message);

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;

      return await this.updateProfile(userId, { avatar_url: publicUrl });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao fazer upload do avatar';
      return Result.fail(msg);
    }
  },
};
