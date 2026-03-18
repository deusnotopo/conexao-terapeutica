import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import { Calendar, Bell, FileText, ChevronRight, Plus, User, Target, DollarSign, Heart, Pill, ShieldAlert, Zap, TrendingUp } from 'lucide-react-native';
import { useUser } from '../../context/UserContext';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPS = [
    '"Pequenos passos todos os dias levam a grandes conquistas." 🦄',
    '"Você não está sozinho nessa jornada. Toda a equipe está ao seu lado." 💚',
    '"Cada sorriso da criança é uma vitória que merece ser celebrada." ⭐',
    '"Cuidar de quem precisa é um ato de coragem e amor." 🌟',
    '"Um dia de cada vez. Você está fazendo um trabalho incrível." 🤍',
];

export const DashboardScreen = ({ navigation }) => {
    const { user, profile, activeDependent } = useUser();
    const [nextEvent, setNextEvent] = useState(null);
    const [stats, setStats] = useState({ eventsToday: 0, newDocs: 0, activeGoals: 0, medsToday: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            setLoading(true);
            const now = new Date().toISOString();
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

            const [nextEventRes, eventsTodayRes, newDocsRes, goalsRes, medsRes] = await Promise.all([
                supabase.from('events').select('*')
                    .eq('dependent_id', activeDependent.id)
                    .gte('start_time', now)
                    .order('start_time', { ascending: true })
                    .limit(1).single(),
                supabase.from('events').select('*', { count: 'exact', head: true })
                    .eq('dependent_id', activeDependent.id)
                    .gte('start_time', startOfDay.toISOString())
                    .lte('start_time', endOfDay.toISOString()),
                supabase.from('documents').select('*', { count: 'exact', head: true })
                    .eq('dependent_id', activeDependent.id)
                    .gte('uploaded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
                supabase.from('therapeutic_goals').select('*', { count: 'exact', head: true })
                    .eq('dependent_id', activeDependent.id)
                    .in('status', ['pending', 'in_progress']),
                supabase.from('medications').select('*', { count: 'exact', head: true })
                    .eq('dependent_id', activeDependent.id)
                    .eq('is_active', true),
            ]);

            setNextEvent(nextEventRes.data);
            setStats({
                eventsToday: eventsTodayRes.count || 0,
                newDocs: newDocsRes.count || 0,
                activeGoals: goalsRes.count || 0,
                medsToday: medsRes.count || 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeDependent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, {profile?.full_name?.split(' ')[0] || 'Cuidador'} 👋</Text>
                        <Text style={styles.subtitle}>
                            {activeDependent ? `Resumo do dia de ${activeDependent.first_name}` : 'Bem-vindo ao Conexão Terapêutica'}
                        </Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={[styles.headerBtn, styles.emergencyBtn]} onPress={() => navigation.navigate('Emergency')}>
                            <ShieldAlert color="#dc2626" size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
                            <Bell color={colors.primaryDark} size={22} />
                            <View style={styles.badge} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ProfileTab')}>
                            <User color={colors.primaryDark} size={22} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Motivational Tip */}
                <View style={styles.tipCard}>
                    <Text style={styles.tipText}>{tip}</Text>
                </View>

                {/* Stats Widgets - 2x2 grid */}
                <View style={styles.widgetsGrid}>
                    <View style={[styles.widget, { borderColor: `${colors.primary}30` }]}>
                        <Calendar color={colors.primary} size={26} />
                        <Text style={styles.widgetValue}>{stats.eventsToday}</Text>
                        <Text style={styles.widgetLabel}>Atividades hoje</Text>
                    </View>
                    <View style={[styles.widget, { borderColor: '#7c3aed30' }]}>
                        <Pill color="#7c3aed" size={26} />
                        <Text style={styles.widgetValue}>{stats.medsToday}</Text>
                        <Text style={styles.widgetLabel}>Medicamentos ativos</Text>
                    </View>
                    <View style={[styles.widget, { borderColor: `${colors.secondary}30` }]}>
                        <Target color={colors.secondary} size={26} />
                        <Text style={styles.widgetValue}>{stats.activeGoals}</Text>
                        <Text style={styles.widgetLabel}>Metas em aberto</Text>
                    </View>
                    <View style={[styles.widget, { borderColor: '#d9770630' }]}>
                        <FileText color="#d97706" size={26} />
                        <Text style={styles.widgetValue}>{stats.newDocs}</Text>
                        <Text style={styles.widgetLabel}>Docs (7 dias)</Text>
                    </View>
                </View>

                {/* Next Appointment Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Próximo Compromisso</Text>
                    {nextEvent ? (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AgendaTab')}>
                            <View style={styles.cardIcon}>
                                <Calendar color={colors.primaryDark} size={24} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{nextEvent.title}</Text>
                                <Text style={styles.cardSubtitle}>
                                    {isToday(new Date(nextEvent.start_time)) ? 'Hoje' : format(new Date(nextEvent.start_time), "dd/MM", { locale: ptBR })},
                                    {' '}{format(new Date(nextEvent.start_time), "HH:mm'h'", { locale: ptBR })}
                                    {nextEvent.location ? ` — ${nextEvent.location}` : ''}
                                </Text>
                            </View>
                            <ChevronRight color={colors.textSecondary} size={20} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AddEvent')}>
                            <Text style={styles.cardSubtitle}>Nenhum compromisso. Agendar agora?</Text>
                            <Plus color={colors.primary} size={20} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Quick Access Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acesso Rápido</Text>
                    <View style={styles.quickGrid}>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('MedicalRecord')}>
                            <Heart color="#dc2626" size={22} />
                            <Text style={styles.quickLabel}>Ficha Médica</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Goals')}>
                            <Target color={colors.secondary} size={22} />
                            <Text style={styles.quickLabel}>Metas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Expenses')}>
                            <DollarSign color="#16a34a" size={22} />
                            <Text style={styles.quickLabel}>Gastos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Consultations')}>
                            <FileText color={colors.primary} size={22} />
                            <Text style={styles.quickLabel}>Consultas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Crisis')}>
                            <Zap color="#dc2626" size={22} />
                            <Text style={styles.quickLabel}>Crises</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Growth')}>
                            <TrendingUp color="#16a34a" size={22} />
                            <Text style={styles.quickLabel}>Crescimento</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    contentContainer: { padding: spacing.l, paddingBottom: 100 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: spacing.l, marginTop: spacing.m,
    },
    greeting: { ...typography.h1, fontSize: 26, color: colors.primaryDark },
    subtitle: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.xs },
    headerButtons: { flexDirection: 'row', gap: spacing.s },
    headerBtn: { padding: spacing.s, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    emergencyBtn: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
    badge: {
        position: 'absolute', top: 8, right: 8, width: 10, height: 10,
        borderRadius: 5, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.surface,
    },
    tipCard: {
        backgroundColor: `${colors.primary}15`, padding: spacing.m, borderRadius: 16,
        marginBottom: spacing.l, borderWidth: 1, borderColor: `${colors.primary}30`,
    },
    tipText: { ...typography.body1, color: colors.primaryDark, fontStyle: 'italic', textAlign: 'center', fontWeight: '500' },
    widgetsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m, marginBottom: spacing.xl,
    },
    widget: {
        width: '47%', backgroundColor: colors.surface, padding: spacing.m, borderRadius: 16,
        alignItems: 'center', borderWidth: 1, gap: spacing.xs,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    widgetValue: { ...typography.h2, color: colors.text },
    widgetLabel: { ...typography.caption, textAlign: 'center', color: colors.textSecondary },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.h3, marginBottom: spacing.m },
    card: {
        flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.m,
        borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    cardIcon: { backgroundColor: `${colors.primary}15`, padding: spacing.s, borderRadius: 12, marginRight: spacing.m },
    cardContent: { flex: 1 },
    cardTitle: { ...typography.body1, fontWeight: '600', color: colors.text },
    cardSubtitle: { ...typography.body2, marginTop: 2 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m },
    quickItem: {
        width: '30%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.m,
        alignItems: 'center', gap: spacing.s, borderWidth: 1, borderColor: colors.border,
    },
    quickLabel: { ...typography.caption, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
