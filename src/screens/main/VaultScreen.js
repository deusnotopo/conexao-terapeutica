import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Platform, Share } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { FileText, Image as ImageIcon, FileArchive, Share2, Plus, Trash2, Search, X } from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';
import { TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'Laudo', label: 'Laudos' },
    { id: 'Receita', label: 'Receitas' },
    { id: 'Exame', label: 'Exames' },
];

export const VaultScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDocuments = useCallback(async () => {
        if (!activeDependent) return;

        try {
            setLoading(true);
            let query = supabase
                .from('documents')
                .select('*')
                .eq('dependent_id', activeDependent.id)
                .order('uploaded_at', { ascending: false });

            if (activeCategory !== 'all') {
                query = query.eq('category', activeCategory);
            }

            const { data, error } = await query;
            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeDependent, activeCategory]);

    const filtered = searchQuery.trim()
        ? documents.filter(d => d.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : documents;

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDocuments();
    };

    const handleDeleteDocument = async (doc) => {
        webAlert(
            'Excluir Documento',
            `Deseja realmente excluir "${doc.title}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Excluir', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error: storageError } = await supabase.storage
                                .from('vault')
                                .remove([doc.file_path]);
                            if (storageError) throw storageError;
                            const { error: dbError } = await supabase
                                .from('documents')
                                .delete()
                                .eq('id', doc.id);
                            if (dbError) throw dbError;
                            fetchDocuments();
                        } catch (error) {
                            console.error('Error deleting document:', error);
                            webAlert('Erro', 'Não foi possível excluir o arquivo.');
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async (doc) => {
        const url = doc.file_url || doc.file_path;
        if (!url) return;
        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            try {
                await Share.share({ message: `${doc.title}: ${url}`, url });
            } catch (e) {
                console.error('Share error:', e);
            }
        }
    };

    const renderIcon = (filePath) => {
        const extension = filePath?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(extension)) return <ImageIcon color={colors.secondary} size={28} />;
        if (extension === 'pdf') return <FileText color={colors.primaryDark} size={28} />;
        return <FileArchive color={colors.textSecondary} size={28} />;
    };

    const renderDocCard = (doc) => (
        <View key={doc.id} style={styles.docCard}>
            <View style={styles.docIconContainer}>
                {renderIcon(doc.file_path)}
            </View>
            <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                <View style={styles.docMeta}>
                    <Text style={styles.metaText}>
                        {format(new Date(doc.uploaded_at), "dd MMM, yyyy", { locale: ptBR })}
                    </Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaText}>{doc.category}</Text>
                </View>
            </View>
            <View style={styles.docActions}>
                <TouchableOpacity 
                    style={[styles.actionIconButton, { backgroundColor: `${colors.error}10` }]}
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
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.categoriesContainer}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                activeCategory === cat.id && styles.activeCategoryChip
                            ]}
                            onPress={() => setActiveCategory(cat.id)}
                        >
                            <Text style={[
                                styles.categoryText,
                                activeCategory === cat.id && styles.activeCategoryText
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Documents List */}
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    style={styles.listContainer} 
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                >
                    {!loading && filtered.length > 0 ? (
                        filtered.map(renderDocCard)
                    ) : !loading && documents.length > 0 ? (
                        <View style={styles.emptyState}>
                            <FileArchive color={colors.border} size={48} />
                            <Text style={styles.emptyTitle}>Nenhum resultado</Text>
                            <Text style={styles.emptySubtitle}>Tente buscar por outro nome.</Text>
                        </View>
                    ) : !loading ? (
                        <View style={styles.emptyState}>
                            <FileArchive color={colors.border} size={48} />
                            <Text style={styles.emptyTitle}>Nenhum arquivo encontrado</Text>
                            <Text style={styles.emptySubtitle}>
                                Não há documentos na categoria "{CATEGORIES.find(c => c.id === activeCategory)?.label}".
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
;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingTop: spacing.m },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        marginBottom: spacing.m,
    },
    title: { ...typography.h1, color: colors.primaryDark },
    subtitle: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.xs },
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
        ...typography.body2,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    activeCategoryText: {
        color: colors.surface,
    },
    listContainer: {
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
        ...typography.body1,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    docMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        ...typography.caption,
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
        ...typography.h3,
        color: colors.text,
        marginTop: spacing.m,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        ...typography.body2,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.s,
        backgroundColor: colors.surface, borderRadius: 12,
        paddingHorizontal: spacing.m, paddingVertical: 10,
        marginHorizontal: spacing.l, marginBottom: spacing.s,
        borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, ...typography.body2, color: colors.text },
});
