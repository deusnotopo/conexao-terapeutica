declare class Notification { static readonly permission: string; static requestPermission(): Promise<string>; }
declare const window: any;
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useMedications } from '../../hooks/useMedications';
import { useAgenda } from '../../hooks/useAgenda';
import { useGoals } from '../../hooks/useGoals';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Bell,
  Pill,
  Calendar,
  Target,
  BellOff,
} from 'lucide-react-native';
import { requestNotificationPermission } from '../../lib/notifications';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationsScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const [notifEnabled, setNotifEnabled] = useState(false);

  // Hooks Pattern (Akita Mode)
  const { 
    medications, 
    loading: loadingMeds, 
    refresh: refreshMeds 
  } = useMedications(activeDependent?.id ?? "");
  
  const { 
    events, 
    loading: loadingEvents, 
    refresh: refreshEvents 
  } = useAgenda(activeDependent?.id ?? "", 'upcoming');
  
  const { 
    goals, 
    loading: loadingGoals, 
    refresh: refreshGoals 
  } = useGoals(activeDependent?.id ?? "");

  const loading = loadingMeds || loadingEvents || loadingGoals;

  const checkNotifPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  useEffect(() => {
    checkNotifPermission();
  }, []);

  // Derived Data
  const filteredMeds = useMemo(() => 
    medications.filter((m: any) => m.is_active), 
  [medications]);

  const filteredEvents = useMemo(() => {
    const nextWeek = addDays(new Date(), 7);
    return events.filter((ev: any) => new Date(ev.start_time) <= nextWeek);
  }, [events]);

  const filteredGoals = useMemo(() => {
    const nextFortnight = addDays(new Date(), 14);
    return goals.filter((g: any) => 
      ['pending', 'in_progress'].includes(g.status) && 
      g.target_date && 
      new Date(g.target_date) <= nextFortnight
    );
  }, [goals]);

  const handleRefresh = () => {
    refreshMeds();
    refreshEvents();
    refreshGoals();
  };

  const formatEventTime = (ts: any) => {
    const d = new Date(ts);
    if (isToday(d)) return `Hoje às ${format(d, 'HH:mm')}`;
    if (isTomorrow(d)) return `Amanhã às ${format(d, 'HH:mm')}`;
    return format(d, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  };

  const hasAnything =
    filteredMeds.length > 0 || filteredEvents.length > 0 || filteredGoals.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lembretes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={false} // Hook handles own refreshing state, simplfied here
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Notification Permission Banner */}
        {!notifEnabled && (
          <TouchableOpacity
            style={styles.permissionBanner}
            onPress={handleEnableNotifications}
          >
            <Bell color="#d97706" size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>
                Ativar notificações do navegador
              </Text>
              <Text style={styles.permissionText}>
                Receba alertas de medicamentos no horário certo. Toque para
                ativar.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {notifEnabled && (
          <View
            style={[
              styles.permissionBanner,
              { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
            ]}
          >
            <Bell color="#16a34a" size={20} />
            <Text style={[styles.permissionTitle, { color: '#16a34a' }]}>
              Notificações ativadas ✅
            </Text>
          </View>
        )}

        {!hasAnything && !loading && (
          <View style={styles.empty}>
            <BellOff color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>Nenhum lembrete</Text>
            <Text style={styles.emptyText}>
              Adicione medicamentos, eventos ou metas para vê-los aqui.
            </Text>
          </View>
        )}

        {/* Medications */}
        {filteredMeds.length > 0 && (
          <>
            <Text style={styles.section}>💊 Medicamentos Ativos</Text>
            {filteredMeds.map((med: any) => (
              <View
                key={med.id}
                style={[styles.card, { borderLeftColor: '#7c3aed' }]}
              >
                <Pill color="#7c3aed" size={20} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{med.name}</Text>
                  {med.dosage && (
                    <Text style={styles.cardSub}>Dose: {med.dosage}</Text>
                  )}
                  {med.frequency_desc && (
                    <Text style={styles.cardSub}>🕐 {med.frequency_desc}</Text>
                  )}
                  {(med.reminder_times || []).length > 0 ? (
                    <Text style={styles.cardSub}>
                      🔔 Alarmes: {(med.reminder_times || []).join(' • ')}
                    </Text>
                  ) : (
                    <Text style={styles.cardSubWarn}>
                      Sem horário cadastrado
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Events */}
        {filteredEvents.length > 0 && (
          <>
            <Text style={styles.section}>📅 Próximos Eventos (7 dias)</Text>
            {filteredEvents.map((ev: any) => (
              <View
                key={ev.id}
                style={[styles.card, { borderLeftColor: colors.primary }]}
              >
                <Calendar color={colors.primary} size={20} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{ev.title}</Text>
                  <Text style={styles.cardSub}>
                    {formatEventTime(ev.start_time)}
                  </Text>
                  {ev.location && (
                    <Text style={styles.cardSub}>📍 {ev.location}</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Goals with deadline */}
        {filteredGoals.length > 0 && (
          <>
            <Text style={styles.section}>🎯 Metas com Prazo Próximo</Text>
            {filteredGoals.map((g: any) => (
              <View
                key={g.id}
                style={[styles.card, { borderLeftColor: colors.secondary }]}
              >
                <Target color={colors.secondary} size={20} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{g.title}</Text>
                  <Text style={styles.cardSub}>
                    Prazo: {g.target_date.split('-').reverse().join('/')}
                  </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: '#fef9c3',
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  permissionTitle: { ...(typography.body2 as object), fontWeight: '700' as const, color: '#d97706' },
  permissionText: { ...(typography.caption as object), color: '#78350f', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    ...(typography.h3 as object),
    fontSize: 16,
    marginBottom: spacing.m,
    marginTop: spacing.s,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  cardInfo: { flex: 1 },
  cardTitle: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  cardSub: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 3 },
  cardSubWarn: { ...(typography.caption as object), color: '#d97706', marginTop: 3 },
});
