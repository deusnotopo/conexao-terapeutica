import { useState, useCallback, useEffect, useRef } from 'react';
import { documentService, DocumentQueryOptions } from '../services/documentService';
import { Document } from '../lib/schemas';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { showToast } from '../components/Toast';
import { webAlert } from '../lib/webAlert';

/**
 * useDocuments Hook (Nível Akita — TypeScript)
 * Gerencia a lista de documentos e mutações resilientes para o Cofre Digital.
 * 
 * Refactored: documentService now returns Result<T>, replacing raw throw/catch pattern.
 */
export const useDocuments = (dependentId: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchDocuments = useCallback(async (reset: boolean = true, category: string = 'all') => {
    if (!dependentId) return;
    
    const currentPage = reset ? 0 : page;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const result = await documentService.getByDependent(dependentId, {
      page: currentPage,
      pageSize: 20,
      category,
    } as DocumentQueryOptions);

    if (!isMounted.current) return;

    if (result.success && result.data) {
      const { documents: docs, total: newTotal } = result.data;
      if (reset) {
        setDocuments(docs);
        setPage(1);
      } else {
        setDocuments(prev => [...prev, ...docs]);
        setPage(prev => prev + 1);
      }
      setTotal(newTotal);
      setHasMore(docs.length === 20);
    } else {
      webAlert('Erro', 'Não foi possível carregar os documentos.');
    }

    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [dependentId, page]);

  useEffect(() => {
    fetchDocuments(true);
  }, [dependentId]);

  const refresh = (category?: string) => {
    setRefreshing(true);
    fetchDocuments(true, category);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) fetchDocuments(false);
  };

  const addDocument = async (metadata: Partial<Document>, fileUri: string) => {
    const result = await syncService.perform('documentService', 'addDocumentWithFile', [
      { ...metadata, dependent_id: dependentId },
      fileUri,
    ]);

    if (result.success) {
      if ((result.metadata as { enqueued?: boolean })?.enqueued) {
        showToast('Upload enfileirado offline. Fique tranquilo.', 'info');
      } else {
        showToast('Documento salvo com sucesso!', 'success');
        if (result.data) setDocuments(prev => [result.data as Document, ...prev]);
        setTotal(prev => prev + 1);
      }
      return true;
    } else {
      webAlert('Erro no Upload', result.error || 'Falha ao salvar documento');
      return false;
    }
  };

  const deleteDocument = async (doc: Document) => {
    const dbResult = await syncService.perform('documentService', 'delete', [doc.id]);
    
    if (dbResult.success) {
      await syncService.perform('storageService', 'deleteFile', ['vault', doc.file_path]);

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setTotal(prev => prev - 1);
      
      if ((dbResult.metadata as { enqueued?: boolean })?.enqueued) {
        showToast('Exclusão pendente offline.', 'info');
      } else {
        showToast('Documento excluído.', 'success');
      }
      return true;
    } else {
      webAlert('Erro', 'Não foi possível excluir o documento.');
      return false;
    }
  };

  return {
    documents,
    loading,
    refreshing,
    loadingMore,
    total,
    hasMore,
    refresh,
    loadMore,
    addDocument,
    deleteDocument,
  };
};
