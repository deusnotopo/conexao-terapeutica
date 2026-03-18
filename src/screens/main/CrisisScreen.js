import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, Plus, Zap, Clock, Trash2, AlertTriangle } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SEVERITY_LABELS = ['', '🟢 Leve', '🟡 Moderada', '🟠 Intensa', '🔴 Severa', '🆘 Emergência'];

export const CrisisScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            const { data } = await supabase
                .from('crisis_events')
                .select('*')
                .eq('dependent_id', activeDependent.id)
                .order('date', { ascending: false })
                .order('time', { ascending: false });
            setEvents(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [activeDependent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = (ev) => {
        webAlert('Excluir Registro', 'Deseja excluir este registro de crise?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await supabase.from('crisis_events').delete().eq('id', ev.id);
                    fetchData();
                }
            }
        ]);
    };

    // Stats
    const thisMonth = events.filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rastreador de Crises</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddCrisis')} style={styles.addBtn}>
                    <Plus color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>

                {/* Monthly Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{events.length}</Text>
                        <Text style={styles.summaryLabel}>Total de Registros</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{thisMonth.length}</Text>
                        <Text style={styles.summaryLabel}>Neste Mês</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>
                            {events.length > 0 ? Math.round(events.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / events.length) : 0}
                        </Text>
                        <Text style={styles.summaryLabel}>Min. Médio</Text>
                    </View>
                </View>

                {events.length === 0 && !loading && (
                    <View style={styles.empty}>
                        <Zap color={colors.border} size={48} />
                        <Text style={styles.emptyTitle}>Nenhum episódio registrado</Text>
                        <Text style={styles.emptyText}>Registre crises para compartilhar dados precisos com o neurologista.</Text>
                    </View>
                )}

                {events.map(ev => (
                    <View key={ev.id} style={[styles.card, ev.severity >= 4 && styles.cardSevere]}>
                        <View style={styles.cardTop}>
                            <View>
                                <Text style={styles.cardDate}>
                                    {format(new Date(ev.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    {ev.time && ` às ${ev.time.substring(0, 5)}`}
                                </Text>
                                <Text style={styles.cardType}>{ev.type}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(ev)} style={styles.deleteBtn}>
                                <Trash2 color={colors.error} size={18} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.chips}>
                            <View style={styles.chip}><Text style={styles.chipText}>{SEVERITY_LABELS[ev.severity] || '—'}</Text></View>
                            {ev.duration_minutes != null && (
                                <View style={styles.chip}>
                                    <Clock color={colors.textSecondary} size={12} />
                                    <Text style={styles.chipText}> {ev.duration_minutes} min</Text>
                                </View>
                            )}
                        </View>

                        {ev.triggers && <Text style={styles.detail}><Text style={styles.detailLabel}>Gatilho: </Text>{ev.triggers}</Text>}
                        {ev.symptoms && <Text style={styles.detail}><Text style={styles.detailLabel}>Sintomas: </Text>{ev.symptoms}</Text>}
                        {ev.medication_given && <Text style={styles.detail}><Text style={styles.detailLabel}>Med. de Resgate: </Text>{ev.medication_given}</Text>}
                        {ev.notes && <Text style={styles.notes}>{ev.notes}</Text>}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.m, height: 60,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    addBtn: { padding: 8, backgroundColor: `${colors.primary}15`, borderRadius: 10 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },
    summaryCard: {
        flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 20,
        padding: spacing.m, marginBottom: spacing.l,
        borderWidth: 1, borderColor: colors.border,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryNumber: { fontSize: 32, fontWeight: '900', color: colors.primaryDark },
    summaryLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    summaryDivider: { width: 1, backgroundColor: colors.border },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyText: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' },
    card: {
        backgroundColor: colors.surface, borderRadius: 16, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    cardSevere: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.s },
    cardDate: { ...typography.body2, fontWeight: '700', color: colors.text },
    cardType: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    deleteBtn: { padding: 4 },
    chips: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.s, flexWrap: 'wrap' },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background, borderRadius: 20,
        paddingHorizontal: spacing.m, paddingVertical: 4,
        borderWidth: 1, borderColor: colors.border,
    },
    chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    detail: { ...typography.body2, color: colors.textSecondary, marginTop: 4 },
    detailLabel: { fontWeight: '700', color: colors.text },
    notes: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.s },
});
