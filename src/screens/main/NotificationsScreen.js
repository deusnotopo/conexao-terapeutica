import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Bell, Pill, Calendar, Target, BellOff } from 'lucide-react-native';
import { requestNotificationPermission } from '../../lib/notifications';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationsScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [meds, setMeds] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [upcomingGoals, setUpcomingGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(false);

    const checkNotifPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotifEnabled(Notification.permission === 'granted');
        }
    };

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        setNotifEnabled(granted);
    };

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            const nextWeek = addDays(new Date(), 7).toISOString();
            const [medsRes, eventsRes, goalsRes] = await Promise.all([
                supabase.from('medications').select('*')
                    .eq('dependent_id', activeDependent.id).eq('is_active', true),
                supabase.from('events').select('*')
                    .eq('dependent_id', activeDependent.id)
                    .gte('start_time', new Date().toISOString())
                    .lte('start_time', nextWeek)
                    .order('start_time', { ascending: true }),
                supabase.from('therapeutic_goals').select('*')
                    .eq('dependent_id', activeDependent.id)
                    .in('status', ['pending', 'in_progress'])
                    .not('target_date', 'is', null)
                    .lte('target_date', addDays(new Date(), 14).toISOString().split('T')[0])
                    .order('target_date', { ascending: true }),
            ]);
            setMeds(medsRes.data || []);
            setUpcomingEvents(eventsRes.data || []);
            setUpcomingGoals(goalsRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [activeDependent]);

    useEffect(() => {
        fetchData();
        checkNotifPermission();
    }, [fetchData]);

    const formatEventTime = (ts) => {
        const d = new Date(ts);
        if (isToday(d)) return `Hoje às ${format(d, 'HH:mm')}`;
        if (isTomorrow(d)) return `Amanhã às ${format(d, 'HH:mm')}`;
        return format(d, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
    };

    const hasAnything = meds.length > 0 || upcomingEvents.length > 0 || upcomingGoals.length > 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Bell color={colors.primaryDark} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lembretes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>

                {/* Notification Permission Banner */}
                {!notifEnabled && (
                    <TouchableOpacity style={styles.permissionBanner} onPress={handleEnableNotifications}>
                        <Bell color="#d97706" size={20} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.permissionTitle}>Ativar notificações do navegador</Text>
                            <Text style={styles.permissionText}>Receba alertas de medicamentos no horário certo. Toque para ativar.</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {notifEnabled && (
                    <View style={[styles.permissionBanner, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                        <Bell color="#16a34a" size={20} />
                        <Text style={[styles.permissionTitle, { color: '#16a34a' }]}>Notificações ativadas ✅</Text>
                    </View>
                )}

                {!hasAnything && !loading && (
                    <View style={styles.empty}>
                        <BellOff color={colors.border} size={48} />
                        <Text style={styles.emptyTitle}>Nenhum lembrete</Text>
                        <Text style={styles.emptyText}>Adicione medicamentos, eventos ou metas para vê-los aqui.</Text>
                    </View>
                )}

                {/* Medications */}
                {meds.length > 0 && (
                    <>
                        <Text style={styles.section}>💊 Medicamentos Ativos</Text>
                        {meds.map(med => (
                            <View key={med.id} style={[styles.card, { borderLeftColor: '#7c3aed' }]}>
                                <Pill color="#7c3aed" size={20} />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{med.name}</Text>
                                    {med.dosage && <Text style={styles.cardSub}>Dose: {med.dosage}</Text>}
                                    {med.frequency_desc && <Text style={styles.cardSub}>🕐 {med.frequency_desc}</Text>}
                                    {(med.reminder_times || []).length > 0
                                        ? <Text style={styles.cardSub}>🔔 Alarmes: {(med.reminder_times || []).join(' • ')}</Text>
                                        : <Text style={styles.cardSubWarn}>Sem horário cadastrado</Text>
                                    }
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Events */}
                {upcomingEvents.length > 0 && (
                    <>
                        <Text style={styles.section}>📅 Próximos Eventos (7 dias)</Text>
                        {upcomingEvents.map(ev => (
                            <View key={ev.id} style={[styles.card, { borderLeftColor: colors.primary }]}>
                                <Calendar color={colors.primary} size={20} />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{ev.title}</Text>
                                    <Text style={styles.cardSub}>{formatEventTime(ev.start_time)}</Text>
                                    {ev.location && <Text style={styles.cardSub}>📍 {ev.location}</Text>}
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Goals with deadline */}
                {upcomingGoals.length > 0 && (
                    <>
                        <Text style={styles.section}>🎯 Metas com Prazo Próximo</Text>
                        {upcomingGoals.map(g => (
                            <View key={g.id} style={[styles.card, { borderLeftColor: colors.secondary }]}>
                                <Target color={colors.secondary} size={20} />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{g.title}</Text>
                                    <Text style={styles.cardSub}>Prazo: {g.target_date.split('-').reverse().join('/')}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
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
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },
    permissionBanner: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.m,
        backgroundColor: '#fef9c3', borderRadius: 12, padding: spacing.m,
        marginBottom: spacing.l, borderWidth: 1, borderColor: '#fde68a',
    },
    permissionTitle: { ...typography.body2, fontWeight: '700', color: '#d97706' },
    permissionText: { ...typography.caption, color: '#78350f', marginTop: 2 },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyText: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' },
    section: { ...typography.h3, fontSize: 16, marginBottom: spacing.m, marginTop: spacing.s },
    card: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing.m,
        backgroundColor: colors.surface, borderRadius: 12, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
        borderLeftWidth: 4,
    },
    cardInfo: { flex: 1 },
    cardTitle: { ...typography.body1, fontWeight: '700', color: colors.text },
    cardSub: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
    cardSubWarn: { ...typography.caption, color: '#d97706', marginTop: 3 },
});
