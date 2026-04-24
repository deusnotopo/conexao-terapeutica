import React, { useState, useEffect, useRef } from 'react';
import { MainTabProps } from '../../navigation/types';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import {
  Calendar,
  Bell,
  FileText,
  ChevronRight,
  Plus,
  User,
  Target,
  DollarSign,
  Heart,
  Pill,
  ShieldAlert,
  Zap,
  TrendingUp,
} from 'lucide-react-native';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useResponsive } from '../../utils/responsive';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPS = [
  '"Pequenos passos todos os dias levam a grandes conquistas." 🦄',
  '"Você não está sozinho nessa jornada. Toda a equipe está ao seu lado." 💚',
  '"Cada sorriso da criança é uma vitória que merece ser celebrada." ⭐',
  '"Cuidar de quem precisa é um ato de coragem e amor." 🌟',
  '"Um dia de cada vez. Você está fazendo um trabalho incrível." 🤍',
];

export const DashboardScreen = ({ navigation }: MainTabProps<'DashboardTab'>) => {
  const { profile, activeDependent } = useUser();
  const { pendingCount, triggerSync } = useSync();
  const { isSmall, isTablet, hPad } = useResponsive();
  
  const {
    nextEvent,
    stats,
    loading,
    refreshing,
    refetch
  } = useDashboardMetrics(activeDependent?.id ?? "");

  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={[styles.container, isTablet && { alignSelf: 'center', width: '100%', maxWidth: 800 }]}
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: hPad }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá, {profile?.full_name?.split(' ')[0] || 'Cuidador'} 👋
            </Text>
            <Text style={styles.subtitle}>
              {activeDependent
                ? `Resumo do dia de ${(activeDependent?.name ?? "")}`
                : 'Bem-vindo ao Conexão Terapêutica'}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerBtn, styles.emergencyBtn]}
              onPress={() => navigation.navigate('Emergency')}
            >
              <ShieldAlert color="#dc2626" size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell color={colors.primaryDark} size={22} />
              {stats.eventsToday > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeText}>{stats.eventsToday}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <User color={colors.primaryDark} size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        {/* Sync Status (Akita logic) */}
        {pendingCount > 0 && (
          <TouchableOpacity 
            style={styles.syncCard} 
            onPress={triggerSync}
            activeOpacity={0.7}
          >
            <View style={styles.syncRow}>
              <Zap color="#16a34a" size={20} fill="#16a34a" />
              <Text style={styles.syncText}>
                {pendingCount} {pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}
              </Text>
            </View>
            <Text style={styles.syncAction}>Sincronizar agora</Text>
          </TouchableOpacity>
        )}

        {/* Stats Widgets - 2x2 grid */}
        <Animated.View
          style={[
            styles.widgetsGrid,
            { opacity: fadeAnim, transform: [{ translateY }] },
          ]}
        >
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
          <View
            style={[styles.widget, { borderColor: `${colors.secondary}30` }]}
          >
            <Target color={colors.secondary} size={26} />
            <Text style={styles.widgetValue}>{stats.activeGoals}</Text>
            <Text style={styles.widgetLabel}>Metas em aberto</Text>
          </View>
          <View style={[styles.widget, { borderColor: '#d9770630' }]}>
            <FileText color="#d97706" size={26} />
            <Text style={styles.widgetValue}>{stats.newDocs}</Text>
            <Text style={styles.widgetLabel}>Docs (7 dias)</Text>
          </View>
        </Animated.View>

        {/* Next Appointment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximo Compromisso</Text>
          {nextEvent ? (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AgendaTab')}
            >
              <View style={styles.cardIcon}>
                <Calendar color={colors.primaryDark} size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{nextEvent.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {isToday(new Date(nextEvent.start_time))
                    ? 'Hoje'
                    : format(new Date(nextEvent.start_time), 'dd/MM', {
                        locale: ptBR,
                      })}
                  ,{' '}
                  {format(new Date(nextEvent.start_time), "HH:mm'h'", {
                    locale: ptBR,
                  })}
                  {nextEvent.location ? ` — ${nextEvent.location}` : ''}
                </Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EventForm')}
            >
              <Text style={styles.cardSubtitle}>
                Nenhum compromisso. Agendar agora?
              </Text>
              <Plus
                color={colors.primary}
                size={20}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate('MedicalRecord')}
            >
              <Heart color="#dc2626" size={22} />
              <Text style={styles.quickLabel}>Ficha Médica</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate('Goals')}
            >
              <Target color={colors.secondary} size={22} />
              <Text style={styles.quickLabel}>Metas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate('Expenses')}
            >
              <DollarSign color="#16a34a" size={22} />
              <Text style={styles.quickLabel}>Gastos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate('Consultations')}
            >
              <FileText color={colors.primary} size={22} />
              <Text style={styles.quickLabel}>Consultas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate('Crisis')}
            >
              <Zap color="#dc2626" size={22} />
              <Text style={styles.quickLabel}>Crises</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickItem}
              onPress={() => navigation.navigate('Growth')}
            >
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
  container: { flexGrow: 1, paddingBottom: 100 },
  contentContainer: {
    paddingVertical: spacing.l,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.m,
  },
  greeting: { ...(typography.h1 as object), fontSize: 26, color: colors.primaryDark },
  subtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerButtons: { flexDirection: 'row', gap: spacing.s },
  headerBtn: {
    padding: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emergencyBtn: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800' as const, color: colors.surface },
  tipCard: {
    backgroundColor: `${colors.primary}15`,
    padding: spacing.m,
    borderRadius: 16,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  tipText: {
    ...(typography.body1 as object),
    color: colors.primaryDark,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  syncCard: {
    backgroundColor: '#f0fdf4',
    padding: spacing.m,
    borderRadius: 16,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  syncText: {
    ...(typography.body2 as object),
    color: '#166534',
    fontWeight: '600' as const,
  },
  syncAction: {
    ...(typography.caption as object),
    color: '#15803d',
    fontWeight: 'bold' as const,
    textDecorationLine: 'underline',
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  widget: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetValue: { ...(typography.h2 as object), color: colors.text },
  widgetLabel: {
    ...(typography.caption as object),
    textAlign: 'center',
    color: colors.textSecondary,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...(typography.h3 as object), marginBottom: spacing.m },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    backgroundColor: `${colors.primary}15`,
    padding: spacing.s,
    borderRadius: 12,
    marginRight: spacing.m,
  },
  cardContent: { flex: 1 },
  cardTitle: { ...(typography.body1 as object), fontWeight: '600' as const, color: colors.text },
  cardSubtitle: { ...(typography.body2 as object), marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m },
  quickItem: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    alignItems: 'center',
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: {
    ...(typography.caption as object),
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
});
