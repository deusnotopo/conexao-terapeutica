import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, Plus, Syringe, Calendar, AlertCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COMMON_VACCINES = [
    'BCG', 'Hepatite B', 'Rotavírus', 'Pentavalente (DTP+Hib+HepB)',
    'Pneumocócica 10V', 'Meningocócica C', 'Poliomielite (VIP/VOP)',
    'Febre Amarela', 'Tríplice Viral (SCR)', 'Varicela', 'Hepatite A',
    'HPV', 'dTpa', 'Influenza', 'Outra'
];

export const VaccinesScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            const { data } = await supabase
                .from('vaccines')
                .select('*')
                .eq('dependent_id', activeDependent.id)
                .order('applied_date', { ascending: false });
            setVaccines(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [activeDependent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const upcoming = vaccines.filter(v => v.next_dose_date && v.next_dose_date >= new Date().toISOString().split('T')[0]);
    const applied = vaccines.filter(v => v.applied_date);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Caderneta de Vacinas</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddVaccine')} style={styles.addBtn}>
                    <Plus color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>

                {upcoming.length > 0 && (
                    <View style={styles.alertCard}>
                        <AlertCircle color="#d97706" size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.alertTitle}>Próximas doses agendadas</Text>
                            {upcoming.slice(0, 3).map(v => (
                                <Text key={v.id} style={styles.alertText}>
                                    {v.name} — {format(new Date(v.next_dose_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {vaccines.length === 0 && !loading && (
                    <View style={styles.empty}>
                        <Syringe color={colors.border} size={48} />
                        <Text style={styles.emptyTitle}>Caderneta vazia</Text>
                        <Text style={styles.emptyText}>Toque no + para registrar a primeira vacina.</Text>
                    </View>
                )}

                {applied.length > 0 && <Text style={styles.section}>Vacinas Aplicadas</Text>}
                {applied.map(v => (
                    <View key={v.id} style={styles.card}>
                        <View style={styles.cardIcon}><Syringe color={colors.primary} size={22} /></View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.vaccineName}>{v.name}</Text>
                            {v.dose_number > 1 && <Text style={styles.vaccineDetail}>Dose {v.dose_number}</Text>}
                            <Text style={styles.vaccineDate}>
                                📅 {format(new Date(v.applied_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </Text>
                            {v.next_dose_date && (
                                <Text style={styles.nextDose}>
                                    🔄 Próxima dose: {format(new Date(v.next_dose_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                                </Text>
                            )}
                            {v.notes && <Text style={styles.vaccineDetail}>{v.notes}</Text>}
                        </View>
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
    alertCard: {
        flexDirection: 'row', gap: spacing.m, backgroundColor: '#fef9c3',
        borderRadius: 12, padding: spacing.m, marginBottom: spacing.l,
        borderWidth: 1, borderColor: '#fde68a',
    },
    alertTitle: { ...typography.body2, fontWeight: '700', color: '#d97706', marginBottom: 4 },
    alertText: { ...typography.caption, color: '#92400e' },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyText: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' },
    section: { ...typography.h3, marginBottom: spacing.m, marginTop: spacing.s },
    card: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing.m,
        backgroundColor: colors.surface, borderRadius: 16, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1 },
    vaccineName: { ...typography.body1, fontWeight: '700', color: colors.text },
    vaccineDate: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
    nextDose: { ...typography.caption, color: '#d97706', marginTop: 4, fontWeight: '600' },
    vaccineDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
