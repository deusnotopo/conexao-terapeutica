import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { Calendar, Clock, MapPin, Pill, Activity, Plus, Trash2, Edit2, CalendarX } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AgendaScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' ou 'history'

    const [medications, setMedications] = useState([]);

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;

        try {
            setLoading(true);
            const now = new Date().toISOString();
            
            // Fetch Events
            let eventQuery = supabase
                .from('events')
                .select('*')
                .eq('dependent_id', activeDependent.id);

            if (activeTab === 'upcoming') {
                eventQuery = eventQuery.gte('start_time', now).order('start_time', { ascending: true });
            } else {
                eventQuery = eventQuery.lt('start_time', now).order('start_time', { ascending: false });
            }

            const { data: eventData, error: eventError } = await eventQuery;
            if (eventError) throw eventError;

            // Fetch Medications (only for upcoming/today)
            let medData = [];
            if (activeTab === 'upcoming') {
                const { data: meds, error: medError } = await supabase
                    .from('medications')
                    .select('*')
                    .eq('dependent_id', activeDependent.id)
                    .eq('is_active', true);
                
                if (medError) throw medError;

                // Fetch logs for today to mark as taken
                const startOfDay = new Date();
                startOfDay.setHours(0,0,0,0);
                
                const { data: logs } = await supabase
                    .from('medication_logs')
                    .select('medication_id')
                    .gte('taken_at', startOfDay.toISOString());

                const takenIds = new Set(logs?.map(l => l.medication_id) || []);
                
                medData = meds?.map(m => ({
                    ...m,
                    taken: takenIds.has(m.id)
                })) || [];
            }

            setEvents(eventData || []);
            setMedications(medData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeDependent, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCheckMedication = async (med) => {
        try {
            const { error } = await supabase
                .from('medication_logs')
                .insert([{
                    medication_id: med.id,
                    taken_at: new Date().toISOString(),
                    status: 'taken'
                }]);
            
            if (error) throw error;
            webAlert('Sucesso', `${med.name} marcado como tomado!`);
            fetchData();
        } catch (error) {
            console.error('Error logging medication:', error);
            webAlert('Erro', 'Não foi possível registrar o medicamento.');
        }
    };

    const handleDeleteEvent = async (event) => {
        webAlert(
            'Excluir Compromisso',
            `Deseja realmente excluir "${event.title}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Excluir', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('events')
                                .delete()
                                .eq('id', event.id);
                            
                            if (error) throw error;
                            fetchData();
                        } catch (error) {
                            console.error('Error deleting event:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteMedication = async (med) => {
        webAlert(
            'Excluir Medicamento',
            `Deseja remover "${med.name}" da lista?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Excluir', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('medications')
                                .delete()
                                .eq('id', med.id);
                            
                            if (error) throw error;
                            fetchData();
                        } catch (error) {
                            console.error('Error deleting medication:', error);
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'equoterapia':
            case 'therapy': 
                return <Activity color={colors.primaryDark} size={24} />;
            case 'medication': 
            case 'remedio':
                return <Pill color={colors.secondary} size={24} />;
            default: 
                return <Calendar color={colors.textSecondary} size={24} />;
        }
    };

    const renderCard = (event) => (
        <View key={event.id} style={styles.eventCard}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    {renderIcon(event.event_type)}
                </View>
                <View style={styles.cardMain}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.detailRow}>
                        <Clock color={colors.textSecondary} size={14} />
                        <Text style={styles.detailText}>
                            {format(new Date(event.start_time), "HH:mm'h'", { locale: ptBR })}
                            {event.end_time && ` - ${format(new Date(event.end_time), "HH:mm'h'", { locale: ptBR })}`}
                        </Text>
                    </View>
                    {event.location && (
                        <View style={styles.detailRow}>
                            <MapPin color={colors.textSecondary} size={14} />
                            <Text style={styles.detailText}>{event.location}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('EditEvent', { event })}
                    >
                        <Edit2 color={colors.primary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => handleDeleteEvent(event)}
                    >
                        <Trash2 color={colors.error} size={18} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Agenda</Text>
                        <Text style={styles.subtitle}>Próximos compromissos e rotina.</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddEvent')}
                    >
                        <Plus color={colors.surface} size={24} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                        onPress={() => setActiveTab('upcoming')}
                    >
                        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Próximos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Histórico</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView 
                    style={styles.content} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                >
                    {!loading && (events.length > 0 || medications.length > 0) ? (
                        <>
                            {activeTab === 'upcoming' && medications.length > 0 && (
                                <>
                                    <Text style={styles.sectionHeader}>Medicamentos de Hoje</Text>
                                    {medications.map(med => (
                                        <View key={med.id} style={styles.eventCard}>
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.iconContainer, { backgroundColor: `${colors.secondary}15` }]}>
                                                    <Pill color={colors.secondary} size={24} />
                                                </View>
                                                <View style={styles.cardMain}>
                                                    <Text style={styles.eventTitle}>{med.name}</Text>
                                                    <Text style={styles.detailText}>{med.dosage} - {med.frequency_desc}</Text>
                                                </View>
                                                <View style={styles.medicationActions}>
                                                    <TouchableOpacity 
                                                        style={styles.actionBtn}
                                                        onPress={() => !med.taken && handleCheckMedication(med)}
                                                        disabled={med.taken}
                                                    >
                                                        <View style={[
                                                            styles.checkCircle, 
                                                            { borderColor: colors.secondary },
                                                            med.taken && { backgroundColor: colors.secondary }
                                                        ]}>
                                                            {med.taken && <Plus color={colors.surface} size={16} style={{ transform: [{ rotate: '45deg' }] }} />}
                                                        </View>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity 
                                                        style={styles.actionBtn}
                                                        onPress={() => handleDeleteMedication(med)}
                                                    >
                                                        <Trash2 color={colors.error} size={18} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </>
                            )}

                            {activeTab === 'upcoming' ? (
                                // Upcoming: group by date
                                (() => {
                                    const grouped = events.reduce((acc, ev) => {
                                        const key = ev.date;
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(ev);
                                        return acc;
                                    }, {});
                                    return Object.entries(grouped).map(([date, evs]) => {
                                        const d = parseISO(date);
                                        let label;
                                        if (isToday(d)) label = '📆 Hoje';
                                        else if (isTomorrow(d)) label = '🚀 Amanhã';
                                        else label = format(d, "EEEE, dd/MM", { locale: ptBR });
                                        label = label.charAt(0).toUpperCase() + label.slice(1);
                                        return (
                                            <View key={date}>
                                                <Text style={styles.sectionHeader}>{label}</Text>
                                                {evs.map(renderCard)}
                                            </View>
                                        );
                                    });
                                })()
                            ) : (
                                <>
                                    <Text style={styles.sectionHeader}>Eventos Passados</Text>
                                    {events.map(renderCard)}
                                </>
                            )}
                        </>
                    ) : !loading ? (
                        <View style={styles.emptyState}>
                            <CalendarX color={`${colors.primary}40`} size={56} />
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'upcoming' ? 'Nenhum compromisso agendado' : 'Sem eventos passados'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'upcoming'
                                    ? 'Toque no + e adicione consultas, sessões de equoterapia e muito mais.'
                                    : 'Os eventos passados aparecerão aqui automaticamente.'}
                            </Text>
                            {activeTab === 'upcoming' && (
                                <TouchableOpacity
                                    style={styles.emptyBtn}
                                    onPress={() => navigation.navigate('AddEvent')}
                                >
                                    <Plus color={colors.surface} size={18} />
                                    <Text style={styles.emptyBtnText}>Adicionar Compromisso</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Carregando...</Text>
                        </View>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.l,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.s,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    tabText: {
        ...typography.body2,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.text,
        fontWeight: '600',
    },
    content: { flex: 1 },
    sectionHeader: {
        ...typography.h3,
        marginBottom: spacing.m,
        color: colors.text,
    },
    eventCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.m,
        marginBottom: spacing.m,
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
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    cardMain: {
        flex: 1,
    },
    eventTitle: {
        ...typography.body1,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    detailText: {
        ...typography.body2,
        marginLeft: spacing.xs,
    },
    actionBtn: {
        padding: spacing.s,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    medicationActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.border,
    },
    emptyState: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.l,
        gap: spacing.m,
    },
    emptyText: { ...typography.body2, color: colors.textSecondary },
    emptyTitle: { ...typography.h3, color: colors.textSecondary, textAlign: 'center' },
    emptySubtitle: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        borderRadius: 50,
        marginTop: spacing.s,
    },
    emptyBtnText: { ...typography.body2, fontWeight: '700', color: colors.surface },
    scrollContent: { paddingBottom: 100 },
});
