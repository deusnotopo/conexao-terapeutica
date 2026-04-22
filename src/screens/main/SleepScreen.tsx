import React, { useState, useEffect, useCallback } from 'react';
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
import { useSleep } from '../../hooks/useSleep';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  Moon,
  Sun,
  Trash2,
  Clock,
  Pencil,
} from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';
import { formatWeekday } from '../../utils/formatDate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { webAlert } from '../../lib/webAlert';

const QUALITY_LABELS = [
  '',
  '😣 Péssimo',
  '😕 Ruim',
  '😐 Regular',
  '😊 Bom',
  '😴 Ótimo',
];
const QUALITY_COLORS = [
  '',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#16a34a',
];

export const SleepScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const { logs, loading, refreshing, refresh, deleteLog } = useSleep(
    activeDependent?.id
  );

  const handleDelete = (log) => {
    webAlert('Excluir Registro', 'Deseja excluir este registro de sono?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteLog(log.id),
      },
    ]);
  };

  // 7-day avg
  const recent7 = logs.slice(0, 7).filter((l: any) => l.duration_hours != null);
  const avgHours =
    recent7.length > 0
      ? (
          recent7.reduce((s: any, l: any) => s + parseFloat(l.duration_hours), 0) /
          recent7.length
        ).toFixed(1)
      : null;
  const avgQuality =
    recent7.length > 0
      ? Math.round(
          recent7.reduce((s: any, l: any) => s + (l.quality || 3), 0) / recent7.length
        )
      : null;

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
        <Text style={styles.headerTitle}>Diário de Sono</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SleepForm')}
          style={styles.addBtn}
        >
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* 7-day Summary */}
        {avgHours && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryInner}>
              <Moon color={colors.primaryDark} size={24} />
              <View>
                <Text style={styles.summaryNum}>{avgHours}h</Text>
                <Text style={styles.summaryLabel}>Média (7 noites)</Text>
              </View>
            </View>
            {avgQuality && (
              <View
                style={[
                  styles.qualityBadge,
                  { backgroundColor: `${QUALITY_COLORS[avgQuality]}15` },
                ]}
              >
                <Text
                  style={[
                    styles.qualityText,
                    { color: QUALITY_COLORS[avgQuality] },
                  ]}
                >
                  {QUALITY_LABELS[avgQuality]}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 7-night bar chart (simple) */}
        {recent7.length > 1 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              Últimas {recent7.length} noites
            </Text>
            <View style={styles.bars}>
              {[...recent7].reverse().map((l, i) => {
                const maxH = 10;
                const pct = Math.min(
                  100,
                  (parseFloat(l.duration_hours) / maxH) * 100
                );
                const color = QUALITY_COLORS[l.quality || 3];
                return (
                  <View key={l.id} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        { height: `${pct}%`, backgroundColor: color },
                      ]}
                    />
                    <Text style={styles.barLabel}>
                      {parseFloat(l.duration_hours).toFixed(0)}h
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {logs.length === 0 && !loading && (
          <View style={styles.empty}>
            <Moon color={colors.border} size={56} />
            <Text style={styles.emptyTitle}>Nenhum registro de sono</Text>
            <Text style={styles.emptyText}>
              Registre as noites para identificar padrões e compartilhar com o
              médico.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('SleepForm')}
            >
              <Plus color="#fff" size={18} />
              <Text style={styles.emptyBtnText}>Registrar Noite</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading && <LoadingState message="Carregando diário de sono..." />}

        {logs.map((l: any) => (
          <View
            key={l.id}
            style={[styles.card, l.quality <= 2 && styles.cardBad]}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardDate}>
                  {format(new Date(l.date + 'T12:00:00'), "EEEE, dd 'de' MMM", {
                    locale: ptBR,
                  })}
                </Text>
                {(l.sleep_time || l.wake_time) && (
                  <Text style={styles.cardTimes}>
                    {l.sleep_time ? `🌙 ${l.sleep_time.substring(0, 5)}` : ''}
                    {l.sleep_time && l.wake_time ? ' → ' : ''}
                    {l.wake_time ? `☀️ ${l.wake_time.substring(0, 5)}` : ''}
                  </Text>
                )}
              </View>
              <View style={styles.cardTopActions}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('SleepForm', { sleep: l })
                  }
                  style={styles.editBtn}
                >
                  <Pencil color={colors.primary} size={15} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(l)}
                  style={styles.deleteBtn}
                >
                  <Trash2 color={colors.error} size={16} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.chips}>
              {l.duration_hours != null && (
                <View style={styles.chip}>
                  <Clock color={colors.textSecondary} size={12} />
                  <Text style={styles.chipText}>
                    {' '}
                    {parseFloat(l.duration_hours).toFixed(1)}h
                  </Text>
                </View>
              )}
              {l.quality && (
                <View
                  style={[
                    styles.chip,
                    { borderColor: `${QUALITY_COLORS[l.quality]}50` },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: QUALITY_COLORS[l.quality] },
                    ]}
                  >
                    {QUALITY_LABELS[l.quality]}
                  </Text>
                </View>
              )}
              {l.awakenings > 0 && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>⚡ {l.awakenings} acord.</Text>
                </View>
              )}
            </View>
            {l.notes ? <Text style={styles.notes}>{l.notes}</Text> : null}
          </View>
        ))}
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
  addBtn: {
    padding: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 10,
  },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: `${colors.primaryDark}08`,
    borderRadius: 20,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: `${colors.primaryDark}20`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  summaryNum: { fontSize: 32, fontWeight: '900' as const, color: colors.primaryDark },
  summaryLabel: { ...(typography.caption as object), color: colors.textSecondary },
  qualityBadge: {
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
  },
  qualityText: { ...(typography.caption as object), fontWeight: '700' as const },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    ...(typography.caption as object),
    fontWeight: '700' as const,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  bars: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    gap: spacing.s,
  },
  barCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { ...(typography.caption as object), fontSize: 9, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.text },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginTop: spacing.s,
  },
  emptyBtnText: { ...(typography.body2 as object), fontWeight: '700' as const, color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBad: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  cardDate: {
    ...(typography.body2 as object),
    fontWeight: '700' as const,
    color: colors.text,
    textTransform: 'capitalize',
  },
  cardTimes: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
    backgroundColor: `${colors.error}10`,
    borderRadius: 8,
  },
  editBtn: {
    padding: 4,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  cardTopActions: { flexDirection: 'row', gap: spacing.s },
  chips: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  notes: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
});
