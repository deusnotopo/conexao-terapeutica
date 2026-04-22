import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { useGrowth } from '../../hooks/useGrowth';
import {
  ChevronLeft,
  Plus,
  TrendingUp,
  Trash2,
  Ruler,
  Weight,
  Pencil,
} from 'lucide-react-native';
import { formatLong, formatShort } from '../../utils/formatDate';
import { LoadingState } from '../../components/LoadingState';

export const GrowthScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const { measurements, loading, refreshing, refresh, deleteMeasurement } =
    useGrowth(activeDependent?.id);

  const handleDelete = (m) => {
    webAlert('Excluir Medição', 'Deseja excluir este registro de crescimento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteMeasurement(m.id),
      },
    ]);
  };

  const latest = measurements[0];
  const prev = measurements[1];

  const diff = (field) => {
    if (!latest || !prev || latest[field] == null || prev[field] == null)
      return null;
    return (latest[field] - prev[field]).toFixed(1);
  };

  const weightDiff = diff('weight_kg');
  const heightDiff = diff('height_cm');

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
        <Text style={styles.headerTitle}>Curva de Crescimento</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('GrowthForm')}
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
        {loading && !refreshing && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing.xl }}
          />
        )}

        {/* Latest Measurement Card */}
        {latest && (
          <View style={styles.latestCard}>
            <Text style={styles.latestLabel}>Última Medição</Text>
            <Text style={styles.latestDate}>{formatLong(latest.date)}</Text>
            <View style={styles.metricsRow}>
              {latest.weight_kg != null && (
                <View style={styles.metricBox}>
                  <Weight color={colors.primary} size={20} />
                  <Text style={styles.metricValue}>{latest.weight_kg} kg</Text>
                  <Text style={styles.metricLabel}>Peso</Text>
                  {weightDiff != null && (
                    <Text
                      style={[
                        styles.metricDiff,
                        parseFloat(weightDiff) >= 0
                          ? styles.diffUp
                          : styles.diffDown,
                      ]}
                    >
                      {parseFloat(weightDiff) >= 0 ? '+' : ''}
                      {weightDiff} kg
                    </Text>
                  )}
                </View>
              )}
              {latest.height_cm != null && (
                <View style={styles.metricBox}>
                  <Ruler color={colors.secondary} size={20} />
                  <Text style={styles.metricValue}>{latest.height_cm} cm</Text>
                  <Text style={styles.metricLabel}>Altura</Text>
                  {heightDiff != null && (
                    <Text style={[styles.metricDiff, styles.diffUp]}>
                      +{heightDiff} cm
                    </Text>
                  )}
                </View>
              )}
              {latest.head_cm != null && (
                <View style={styles.metricBox}>
                  <TrendingUp color="#d97706" size={20} />
                  <Text style={styles.metricValue}>{latest.head_cm} cm</Text>
                  <Text style={styles.metricLabel}>Perímetro Cefálico</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {measurements.length === 0 && !loading && (
          <View style={styles.empty}>
            <TrendingUp color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>Nenhuma medição registrada</Text>
            <Text style={styles.emptyText}>
              Registre peso, altura e perímetro cefálico para acompanhar o
              desenvolvimento.
            </Text>
          </View>
        )}

        {/* History */}
        {measurements.length > 0 && (
          <Text style={styles.section}>Histórico de Medições</Text>
        )}
        {measurements.map((m, idx) => (
          <View key={m.id} style={styles.historyCard}>
            <View style={styles.historyDot} />
            <View style={styles.historyContent}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {formatShort(m.date)}
                  {idx === 0 && (
                    <Text style={styles.latestBadge}> (Mais recente)</Text>
                  )}
                </Text>
                <View style={styles.historyActions}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('GrowthForm', { measurement: m })
                    }
                    style={styles.editBtn}
                  >
                    <Pencil color={colors.primary} size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(m)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 color={colors.error} size={14} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.historyMetrics}>
                {m.weight_kg != null && (
                  <Text style={styles.historyMetric}>⚖️ {m.weight_kg} kg</Text>
                )}
                {m.height_cm != null && (
                  <Text style={styles.historyMetric}>📏 {m.height_cm} cm</Text>
                )}
                {m.head_cm != null && (
                  <Text style={styles.historyMetric}>🧠 {m.head_cm} cm</Text>
                )}
              </View>
              {m.notes && <Text style={styles.historyNote}>{m.notes}</Text>}
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
  latestCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.l,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  latestLabel: {
    ...(typography.caption as object),
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  latestDate: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metricBox: { alignItems: 'center', gap: 4 },
  metricValue: { fontSize: 24, fontWeight: '900' as const, color: colors.primaryDark },
  metricLabel: { ...(typography.caption as object), color: colors.textSecondary },
  metricDiff: { ...(typography.caption as object), fontWeight: '700' as const, fontSize: 12 },
  diffUp: { color: '#16a34a' },
  diffDown: { color: '#dc2626' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: { ...(typography.h3 as object), fontSize: 18, marginBottom: spacing.m },
  historyCard: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  historyContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: {
    ...(typography.body2 as object),
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  latestBadge: {
    ...(typography.caption as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyActions: { flexDirection: 'row', gap: spacing.s },
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
  historyMetrics: { flexDirection: 'row', gap: spacing.m, flexWrap: 'wrap' },
  historyMetric: { ...(typography.body2 as object), color: colors.textSecondary },
  historyNote: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
});
