import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, Plus, Stethoscope, User, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ConsultationsScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            const { data } = await supabase
                .from('consultations')
                .select('*')
                .eq('dependent_id', activeDependent.id)
                .order('date', { ascending: false });
            setConsultations(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeDependent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = (c) => {
        webAlert('Excluir Consulta', `Deseja excluir a consulta de ${c.specialty}? Esta ação não pode ser desfeita.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await supabase.from('consultations').delete().eq('id', c.id);
                    fetchData();
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Histórico de Consultas</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddConsultation')} style={styles.addBtn}>
                    <Plus color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>
                {consultations.length === 0 && !loading ? (
                    <View style={styles.empty}>
                        <Stethoscope color={colors.border} size={48} />
                        <Text style={styles.emptyTitle}>Nenhuma consulta registrada</Text>
                        <Text style={styles.emptyText}>Toque no + para registrar a primeira consulta.</Text>
                    </View>
                ) : null}

                {consultations.map(c => (
                    <View key={c.id} style={styles.card}>
                        <View style={styles.cardLeft}>
                            <View style={styles.iconBox}>
                                <Stethoscope color={colors.primary} size={22} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.specialty}>{c.specialty}</Text>
                                {c.physician_name ? <Text style={styles.physician}><User size={12} color={colors.textSecondary} /> {c.physician_name}</Text> : null}
                                {c.cid_code ? <Text style={styles.cid}>CID: {c.cid_code}</Text> : null}
                                {c.notes ? <Text style={styles.notes} numberOfLines={2}>{c.notes}</Text> : null}
                                {c.next_appointment ? (
                                    <Text style={styles.nextAppt}>
                                        📅 Retorno: {format(new Date(c.next_appointment + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.date}>{format(new Date(c.date + 'T12:00:00'), "dd/MM/yy", { locale: ptBR })}</Text>
                            <TouchableOpacity onPress={() => handleDelete(c)} style={styles.deleteBtn}>
                                <Trash2 color={colors.error} size={16} />
                            </TouchableOpacity>
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
    backButton: { padding: 4 },
    addBtn: { padding: 8, backgroundColor: `${colors.primary}15`, borderRadius: 10 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyText: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' },
    card: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        backgroundColor: colors.surface, borderRadius: 16, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    cardLeft: { flexDirection: 'row', flex: 1, gap: spacing.m },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center',
    },
    cardInfo: { flex: 1 },
    specialty: { ...typography.body1, fontWeight: '700', color: colors.text },
    physician: { ...typography.body2, color: colors.textSecondary, marginTop: 2 },
    cid: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    notes: { ...typography.caption, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
    nextAppt: { ...typography.caption, color: colors.primary, marginTop: 6, fontWeight: '600' },
    cardRight: { alignItems: 'flex-end', gap: spacing.s, marginLeft: spacing.s },
    date: { ...typography.caption, color: colors.textSecondary },
    deleteBtn: { padding: 4, backgroundColor: `${colors.error}10`, borderRadius: 8 },
});
