import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, Plus, Pill, CheckCircle, XCircle, PauseCircle, Edit2 } from 'lucide-react-native';

export const MedicationsScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inactive'

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            const { data } = await supabase
                .from('medications')
                .select('*')
                .eq('dependent_id', activeDependent.id)
                .order('name', { ascending: true });
            setMedications(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [activeDependent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleToggleActive = (med) => {
        const action = med.is_active ? 'desativar' : 'reativar';
        webAlert(
            `${med.is_active ? 'Desativar' : 'Reativar'} Medicamento`,
            `Deseja ${action} "${med.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar', onPress: async () => {
                        await supabase.from('medications').update({ is_active: !med.is_active }).eq('id', med.id);
                        fetchData();
                    }
                }
            ]
        );
    };

    const handleDelete = (med) => {
        webAlert('Excluir Medicamento', `Deseja excluir permanentemente "${med.name}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await supabase.from('medications').delete().eq('id', med.id);
                    fetchData();
                }
            }
        ]);
    };

    const handleUpdateStock = (med) => {
        const opts = ['-5', '-1', '+1', '+5', '+10', '+30'].map(delta => ({
            text: delta,
            onPress: async () => {
                const current = med.stock_count ?? 0;
                const next = Math.max(0, current + parseInt(delta));
                await supabase.from('medications').update({ stock_count: next }).eq('id', med.id);
                fetchData();
            }
        }));
        webAlert('Atualizar Estoque', `Estoque atual: ${med.stock_count ?? '—'}\nSelecione a alteração:`, opts);
    };

    const displayed = medications.filter(m => activeTab === 'active' ? m.is_active : !m.is_active);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medicamentos</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddMedication')} style={styles.addBtn}>
                    <Plus color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {['active', 'inactive'].map(tab => (
                    <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}>
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'active' ? '✅ Ativos' : '⏸ Inativos'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>
                {displayed.length === 0 && !loading && (
                    <View style={styles.empty}>
                        <Pill color={colors.border} size={48} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'active' ? 'Nenhum medicamento ativo' : 'Nenhum medicamento inativo'}
                        </Text>
                        {activeTab === 'active' && <Text style={styles.emptyText}>Toque no + para adicionar o primeiro.</Text>}
                    </View>
                )}
                {displayed.map(med => {
                    const stockLow = med.stock_count != null && med.stock_count <= (med.stock_alert_at ?? 5);
                    return (
                    <View key={med.id} style={[styles.card, !med.is_active && styles.cardInactive, stockLow && styles.cardLowStock]}>
                        <View style={styles.cardIcon}>
                            <Pill color={med.is_active ? '#7c3aed' : colors.textSecondary} size={24} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.medName}>{med.name}</Text>
                            {med.dosage ? <Text style={styles.medDetail}>Dose: {med.dosage}</Text> : null}
                            {med.frequency_desc ? <Text style={styles.medDetail}>🕐 {med.frequency_desc}</Text> : null}
                            {(med.reminder_times || []).length > 0 && (
                                <Text style={styles.medDetail}>🔔 {(med.reminder_times || []).join(' • ')}</Text>
                            )}
                            {med.stock_count != null && (
                                <TouchableOpacity onPress={() => handleUpdateStock(med)} style={styles.stockRow}>
                                    <Text style={[styles.stockText, stockLow && styles.stockTextLow]}>
                                        {stockLow ? '⚠️' : '📦'} Estoque: {med.stock_count} unid.
                                    </Text>
                                    <Text style={styles.stockEdit}>Editar</Text>
                                </TouchableOpacity>
                            )}
                            {med.stock_count == null && med.is_active && (
                                <TouchableOpacity onPress={() => handleUpdateStock(med)} style={styles.stockAddBtn}>
                                    <Text style={styles.stockAddText}>+ Rastrear estoque</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity onPress={() => handleToggleActive(med)} style={styles.actionBtn}>
                                {med.is_active
                                    ? <PauseCircle color={colors.secondary} size={22} />
                                    : <CheckCircle color={colors.primary} size={22} />
                                }
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(med)} style={styles.actionBtn}>
                                <XCircle color={colors.error} size={22} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    );
                })}
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
    tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: spacing.m, alignItems: 'center' },
    tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
    tabText: { ...typography.body2, color: colors.textSecondary, fontWeight: '600' },
    tabTextActive: { color: colors.primary },
    container: { padding: spacing.l, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyText: { ...typography.body2, color: colors.textSecondary },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderRadius: 16, padding: spacing.m, marginBottom: spacing.m,
        borderWidth: 1, borderColor: colors.border, gap: spacing.m,
    },
    cardInactive: { opacity: 0.6 },
    cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7c3aed15', justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1 },
    medName: { ...typography.body1, fontWeight: '700', color: colors.text },
    medDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
    cardActions: { flexDirection: 'row', gap: spacing.s },
    actionBtn: { padding: 4 },
    cardLowStock: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
    stockRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4,
        backgroundColor: colors.background, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    stockText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    stockTextLow: { color: '#dc2626', fontWeight: '700' },
    stockEdit: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    stockAddBtn: { marginTop: 4 },
    stockAddText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
