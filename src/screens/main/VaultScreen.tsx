import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { MainTabProps } from '../../navigation/types';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Share,
} from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  Share2,
  Plus,
  Trash2,
  Search,
  X,
} from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';
import { TextInput } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../hooks/useDocuments';
import { Document } from '../../lib/schemas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'Laudo', label: 'Laudos' },
  { id: 'Receita', label: 'Receitas' },
  { id: 'Exame', label: 'Exames' },
];

const PAGE_SIZE = 20;

export const VaultScreen = ({ navigation }: MainTabProps<'VaultTab'>) => {
  const { activeDependent } = useUser();
  const {
    documents,
    loading,
    refreshing,
    loadingMore,
    total,
    hasMore,
    refresh,
    loadMore,
    deleteDocument,
  } = useDocuments(activeDependent?.id ?? "");

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = () => {
    refresh(activeCategory);
  };

  useEffect(() => {
    refresh(activeCategory);
  }, [activeDependent, activeCategory]);

  const filtered = searchQuery.trim()
    ? documents.filter((d: Document) =>
        d.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  const handleDeleteDocument = async (doc: Document) => {
    webAlert('Excluir Documento', `Deseja realmente excluir "${doc.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteDocument(doc);
        },
      },
    ]);
  };

  const handleShare = async (doc: Document) => {
    if (!doc.file_path) return;
    
    let url = doc.file_path;
    if (!url.startsWith('http')) {
      const { data } = supabase.storage.from('vault').getPublicUrl(doc.file_path);
      url = data.publicUrl;
    }

    if (Platform.OS === 'web') {
      const g = globalThis as unknown as { window?: { open: (url: string, target: string) => void } };
      g.window?.open(url, '_blank');
    } else {
      try {
        await Share.share({ message: `${doc.title}: ${url}`, url });
      } catch (e: unknown) {
        // Silent
      }
    }
  };

  const renderIcon = (filePath?: string | null) => {
    const extension = filePath?.split('.').pop()?.toLowerCase();
    if (extension && ['jpg', 'jpeg', 'png'].includes(extension))
      return <ImageIcon color={colors.secondary} size={28} />;
    if (extension === 'pdf')
      return <FileText color={colors.primaryDark} size={28} />;
    return <FileArchive color={colors.textSecondary} size={28} />;
  };

  const renderDocCard = (doc: Document) => (
    <View key={doc.id} style={styles.docCard}>
      <View style={styles.docIconContainer}>{renderIcon(doc.file_path as string)}</View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        <View style={styles.docMeta}>
          <Text style={styles.docDate}>
            {format(doc.uploaded_at ? new Date(doc.uploaded_at) : new Date(), "dd MMM yyyy", {
              locale: ptBR,
            })}
          </Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{doc.category}</Text>
        </View>
      </View>
      <View style={styles.docActions}>
        <TouchableOpacity
          style={[
            styles.actionIconButton,
            { backgroundColor: `${colors.error}10` },
          ]}
          onPress={() => handleDeleteDocument(doc)}
        >
          <Trash2 color={colors.error} size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={() => handleShare(doc)}
          accessibilityLabel="Compartilhar documento"
        >
          <Share2 color={colors.primary} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cofre Digital</Text>
            <Text style={styles.subtitle}>Seus laudos, exames e receitas.</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('UploadDoc')}
          >
            <Plus color={colors.surface} size={24} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={18} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar documento..."
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView keyboardShouldPersistTaps="handled"
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat: {id: string, label: string}) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && styles.activeCategoryChip,
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat.id && styles.activeCategoryText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Documents List */}
        <ScrollView keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {!loading && filtered.length > 0 ? (
            <>
              {filtered.map(renderDocCard)}
              {documents.length > 0 && (
                <Text style={styles.counter}>
                  Exibindo {documents.length} de {total} documento
                  {total !== 1 ? 's' : ''}
                </Text>
              )}
              {hasMore && !searchQuery.trim() && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={loadMore}
                  disabled={loadingMore}
                >
                  <Text style={styles.loadMoreText}>
                    {loadingMore ? 'Carregando...' : 'Carregar mais'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : !loading && documents.length > 0 ? (
            <View style={styles.emptyState}>
              <FileArchive color={colors.border} size={48} />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar por outro nome.
              </Text>
            </View>
          ) : !loading ? (
            <View style={styles.emptyState}>
              <FileArchive color={colors.border} size={48} />
              <Text style={styles.emptyTitle}>Nenhum arquivo encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Não há documentos na categoria "
                {CATEGORIES.find((c: {id: string, label: string}) => c.id === activeCategory)?.label}".
              </Text>
            </View>
          ) : (
            <LoadingState message="Carregando documentos..." />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    paddingTop: spacing.m, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    marginBottom: spacing.m,
  },
  title: { ...(typography.h1 as object), color: colors.primaryDark },
  subtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoriesContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    maxHeight: 50,
    marginBottom: spacing.m,
  },
  categoriesContent: {
    paddingHorizontal: spacing.l,
    gap: spacing.s,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryChip: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  categoryText: {
    ...(typography.body2 as object),
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  activeCategoryText: {
    color: colors.surface,
  },
  listContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: 100,
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  docIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: `${colors.background}`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  docInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  docTitle: {
    ...(typography.body1 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  docDate: {
    ...(typography.caption as object),
    color: colors.textSecondary,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...(typography.caption as object),
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  docActions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginLeft: spacing.s,
  },
  actionIconButton: {
    padding: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...(typography.h3 as object),
    color: colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...(typography.body2 as object),
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: 10,
    marginHorizontal: spacing.l,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, ...(typography.body2 as object), color: colors.text },
  counter: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.m,
  },
  loadMoreBtn: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginHorizontal: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  loadMoreText: {
    ...(typography.body2 as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
});
