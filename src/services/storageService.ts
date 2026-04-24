import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export type UploadResult = { path: string; fullPath: string };

/**
 * Serviço de Gerenciamento de Arquivos (Nível Akita — TypeScript)
 * Abstrai o Supabase Storage e gerencia resiliência local.
 */
export const storageService = {
  /**
   * Faz o upload de um arquivo para o storage.
   */
  async uploadFile(
    bucket: string,
    path: string,
    fileUri: string,
    options: { contentType?: string } = {}
  ): Promise<Result<UploadResult>> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return Result.fail('Arquivo não encontrado no dispositivo.');
      }

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, decode(base64), {
          contentType: options.contentType || 'application/octet-stream',
          upsert: true,
        });

      if (error) return Result.fail(error.message);

      return Result.ok({
        path: data.path,
        fullPath: `${bucket}/${data.path}`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado no upload';
      return Result.fail(msg);
    }
  },

  /**
   * Obtém a URL pública de um arquivo.
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || '';
  },

  /**
   * Remove um arquivo do storage.
   */
  async deleteFile(bucket: string, path: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao remover arquivo';
      return Result.fail(msg);
    }
  },

  /**
   * Cache de arquivos local para visualização offline.
   */
  async cacheFile(fileUri: string, fileName: string): Promise<Result<string>> {
    try {
      const baseDir = FileSystem.documentDirectory ?? '';
      const cacheDir = `${baseDir}.vault_cache/`;

      const destination = `${cacheDir}${fileName}`;
      
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }
      
      await FileSystem.copyAsync({ from: fileUri, to: destination });
      return Result.ok(destination);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar cache local do arquivo';
      return Result.fail(msg);
    }
  },
};
