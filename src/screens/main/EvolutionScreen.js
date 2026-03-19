import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { Stethoscope, Star, CalendarDays, Info, ClipboardList } from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { formatMedium } from '../../utils/formatDate';

export const EvolutionScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotes = useCallback(async () => {
        if (!activeDependent) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('therapy_notes')
                .select(`
                    *,
                    profiles:therapist_id (full_name)
                `)
                .eq('dependent_id', activeDependent.id)
                .order('session_date', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error fetching therapy notes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeDependent]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotes();
    };

    const renderStars = (rating) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={16} 
                        color={star <= rating ? colors.warning : colors.border} 
                        fill={star <= rating ? colors.warning : 'transparent'} 
                    />
                ))}
            </View>
        );
    };

    const renderNoteCard = (note) => (
        <View key={note.id} style={styles.timelineItem}>
            <View style={styles.timelineLine} />
            <View style={styles.timelineDot}>
                <View style={styles.innerDot} />
            </View>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <CalendarDays color={colors.textSecondary} size={16} />
                        <Text style={styles.dateText}>
                            {formatMedium(note.session_date)}
                        </Text>
                    </View>
                    {renderStars(note.progress_rating)}
                </View>
                <Text style={styles.therapistText}>
                    {note.profiles?.full_name || 'Terapeuta'}
                </Text>
                <Text style={styles.contentText}>{note.content}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Prontuário</Text>
                        <Text style={styles.subtitle}>Evolução e registros terapêuticos.</Text>
                    </View>
                     <TouchableOpacity 
                        style={styles.infoButton}
                        onPress={() => webAlert('ℹ️ Registros de Evolução', 'Novos registros de evolução são inseridos pela equipe terapêutica (terapeuta ou responsável autorizado) diretamente no sistema.')}
                     >
                        <Info color={colors.primaryDark} size={20} />
                    </TouchableOpacity>
                </View>

                {/* Resumo Rápido */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryIcon}>
                        <Stethoscope color={colors.primaryDark} size={28} />
                    </View>
                    <View style={styles.summaryText}>
                        <Text style={styles.summaryTitle}>Evolução Constante</Text>
                        <Text style={styles.summaryDesc}>
                            {notes.length > 0 
                                ? `Já são ${notes.length} registros de evolução!` 
                                : 'Acompanhe aqui o desenvolvimento do seu pequeno.'}
                        </Text>
                    </View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                >
                    {!loading && notes.length > 0 ? (
                        notes.map(renderNoteCard)
                    ) : !loading ? (
                        <View style={styles.emptyState}>
                            <ClipboardList color={colors.border} size={56} />
                            <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
                            <Text style={styles.emptyText}>
                                Os registros de evolução são inseridos pela equipe terapêutica após cada sessão.
                            </Text>
                        </View>
                    ) : (
                        <LoadingState message="Carregando prontuário..." />
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: spacing.l, paddingTop: spacing.m },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    title: { ...typography.h1, color: colors.primaryDark },
    subtitle: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.xs },
    infoButton: {
        backgroundColor: `${colors.secondary}15`,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${colors.secondary}30`,
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: `${colors.secondary}15`,
        padding: spacing.m,
        borderRadius: 16,
        marginBottom: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${colors.secondary}30`,
    },
    summaryIcon: {
        marginRight: spacing.m,
    },
    summaryText: {
        flex: 1,
    },
    summaryTitle: {
        ...typography.body1,
        fontWeight: 'bold',
        color: colors.primaryDark,
        marginBottom: 2,
    },
    summaryDesc: {
        ...typography.body2,
        color: colors.textSecondary,
    },
    scrollContent: {
        paddingBottom: 90,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: spacing.l,
    },
    timelineLine: {
        position: 'absolute',
        left: 9, // centraliza na bolinha
        top: 24,
        bottom: -spacing.l, // conecta com o próximo
        width: 2,
        backgroundColor: colors.border,
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${colors.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
        marginTop: 4,
        borderWidth: 2,
        borderColor: colors.surface,
        zIndex: 1,
    },
    innerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        ...typography.caption,
        marginLeft: 6,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    therapistText: {
        ...typography.body2,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
    },
    contentText: {
        ...typography.body1,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        gap: spacing.m,
        paddingHorizontal: spacing.l,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.text,
        textAlign: 'center',
    },
    emptyText: {
        ...typography.body2,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    }
});
