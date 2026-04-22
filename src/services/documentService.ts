import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { storageService } from './storageService';
import { Result } from '../lib/result';

// ─── Schema ───────────────────────────────────────────────────────────────────

export const DocumentSchema = z.object({
  id: z.string().optional(),
  dependent_id: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório'),
  category: z.enum(['Laudo', 'Exame', 'Receita', 'Outro']),
  file_path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  file_type: z.string().optional(),
  uploaded_at: z.string().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

export type DocumentQueryOptions = {
  category?: string;
  page?: number;
  pageSize?: number;
};

export type DocumentListResult = { documents: Document[]; total: number };

/**
 * Serviço de Documentos — Cofre Digital (TypeScript)
 * Refactored to use Result<T> pattern throughout for consistency.
 */
export const documentService = {
  /**
   * Lista documentos de um dependente.
   */
  async getByDependent(
    dependentId: string,
    options: DocumentQueryOptions = {}
  ): Promise<Result<DocumentListResult>> {
    const { category, page = 0, pageSize = 20 } = options;

    try {
      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('dependent_id', dependentId)
        .order('uploaded_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, count, error } = await query;
      if (error) return Result.fail(error.message);

      const validated = z.array(DocumentSchema).safeParse(data || []);
      if (!validated.success) return Result.fail('Erro de integridade nos documentos.');

      return Result.ok({ documents: validated.data, total: count ?? 0 });
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao listar documentos');
    }
  },

  /**
   * Adiciona um novo registro de documento.
   */
  async create(documentData: Partial<Document>): Promise<Result<Document>> {
    const validated = DocumentSchema.safeParse(documentData);
    if (!validated.success) {
      return Result.fail(`Dados do documento inválidos: ${validated.error.issues[0].message}`);
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([validated.data])
        .select()
        .single();

      if (error) return Result.fail(error.message);

      const parsedResult = DocumentSchema.safeParse(data);
      if (!parsedResult.success) return Result.fail('Documento criado mas com erro de contrato.');

      return Result.ok(parsedResult.data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao criar documento');
    }
  },

  /**
   * Remove um documento (apenas registro no banco).
   */
  async delete(id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao excluir documento');
    }
  },

  /**
   * Operação robusta que faz upload e registra no banco.
   */
  async addDocumentWithFile(
    documentData: Partial<Document>,
    fileUri: string
  ): Promise<Result<Document>> {
    try {
      const storageResult = await storageService.uploadFile(
        'vault',
        documentData.file_path || '',
        fileUri,
        { contentType: documentData.file_type }
      );

      if (!storageResult.success) {
        return Result.fail('Falha ao subir arquivo para o storage.');
      }

      return await this.create({
        ...documentData,
        file_path: storageResult.data?.path,
      });
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro no processo de salvamento do documento.');
    }
  },
};
