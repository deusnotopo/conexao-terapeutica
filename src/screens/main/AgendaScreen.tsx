import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainTabProps } from '../../navigation/types';
import { Event, Medication } from '../../lib/schemas';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import {
  Calendar,
  Clock,
  MapPin,
  Pill,
  Activity,
  Plus,
  Trash2,
  Edit2,
  CalendarX,
  Check,
} from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';
import { useUser } from '../../context/UserContext';
import { useAgenda } from '../../hooks/useAgenda';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useResponsive } from '../../utils/responsive';

export const AgendaScreen = ({ navigation }: MainTabProps<'AgendaTab'>) => {
  const { activeDependent } = useUser();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' ou 'history'
  const { isSmall, hPad, isTablet } = useResponsive();

  const {
    events,
    medications,
    loading,
    refreshing,
    refresh,
    deleteEvent,
    logMedication,
  } = useAgenda(activeDependent?.id ?? "", activeTab === 'history' ? 'past' : 'upcoming');

  const handleDeleteEvent = async (event: Event) => {
    webAlert(
      'Excluir Compromisso',
      `Deseja realmente excluir "${event.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(event.id);
          },
        },
      ]
    );
  };

  const handleCheckMedication = async (med: Medication & { taken?: boolean }) => {
    if (med.taken) return;
    await logMedication(med.id);
  };


  const renderIcon = (type: string | undefined | null) => {
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

  const renderCard = (event: Event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>{renderIcon(event.event_type)}</View>
        <View style={styles.cardMain}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.detailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={styles.detailText}>
              {format(new Date(event.start_time), "HH:mm'h'", { locale: ptBR })}
              {event.end_time &&
                ` - ${format(new Date(event.end_time), "HH:mm'h'", { locale: ptBR })}`}
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
            onPress={() => navigation.navigate('EventForm', { event })}
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
      <View style={[styles.container, { paddingHorizontal: hPad }, isTablet && { alignSelf: 'center', width: '100%', maxWidth: 800 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Agenda</Text>
            <Text style={styles.subtitle}>Próximos compromissos e rotina.</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('EventForm')}
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
            <Text
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.activeTabText,
              ]}
            >
              Próximos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.activeTabText,
              ]}
            >
              Histórico
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[colors.primary]}
            />
          }
        >
          {!loading && (events.length > 0 || medications.length > 0) ? (
            <>
              {activeTab === 'upcoming' && medications.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Medicamentos de Hoje</Text>
                  {medications.map((med: Medication & { taken?: boolean, taken_at?: string }) => (
                    <View key={med.id} style={styles.eventCard}>
                      <View style={styles.cardHeader}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: `${colors.secondary}15` },
                          ]}
                        >
                          <Pill color={colors.secondary} size={24} />
                        </View>
                        <View style={styles.cardMain}>
                          <Text style={styles.eventTitle}>{med.name}</Text>
                          <Text style={styles.detailText}>
                            {med.dosage} - {med.frequency_desc}
                          </Text>
                        </View>
                        <View style={styles.medicationActions}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() =>
                              !med.taken && handleCheckMedication(med)
                            }
                            disabled={med.taken}
                          >
                            <View
                              style={[
                                styles.checkCircle,
                                { borderColor: colors.secondary },
                                med.taken && {
                                  backgroundColor: colors.secondary,
                                },
                              ]}
                            >
                              {med.taken && (
                                <Check color={colors.surface} size={16} />
                              )}
                            </View>
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
                  const grouped = events.reduce((groups: Record<string, Event[]>, event: Event) => {
                    const dateStr = event.start_time.split('T')[0];
                    if (!groups[dateStr]) groups[dateStr] = [];
                    groups[dateStr].push(event);
                    return groups;
                  }, {});
                  return Object.entries(grouped).map(([date, evs]: [string, Event[]]) => {
                    const d = parseISO(date);
                    let label;
                    if (isToday(d)) label = '📆 Hoje';
                    else if (isTomorrow(d)) label = '🚀 Amanhã';
                    else label = format(d, 'EEEE, dd/MM', { locale: ptBR });
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
                  {events.map((evt: Event) => renderCard(evt))}
                </>
              )}
            </>
          ) : !loading ? (
            <View style={styles.emptyState}>
              <CalendarX color={`${colors.primary}40`} size={56} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? 'Nenhum compromisso agendado'
                  : 'Sem eventos passados'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Toque no + e adicione consultas, sessões de equoterapia e muito mais.'
                  : 'Os eventos passados aparecerão aqui automaticamente.'}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('EventForm')}
                >
                  <Plus color={colors.surface} size={18} />
                  <Text style={styles.emptyBtnText}>Adicionar Compromisso</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <LoadingState message="Buscando agendamentos..." />
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingTop: spacing.m, 
    paddingBottom: 100 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
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
    ...(typography.body2 as object),
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600' as const,
  },
  content: { flex: 1 },
  sectionHeader: {
    ...(typography.h3 as object),
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
    ...(typography.body1 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    ...(typography.body2 as object),
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
  emptyText: { ...(typography.body2 as object), color: colors.textSecondary },
  emptyTitle: {
    ...(typography.h3 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
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
  emptyBtnText: {
    ...(typography.body2 as object),
    fontWeight: '700' as const,
    color: colors.surface,
  },
  scrollContent: { paddingBottom: 100 },
});
