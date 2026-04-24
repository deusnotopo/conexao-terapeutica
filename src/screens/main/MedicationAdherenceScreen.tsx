import React, { useState, useEffect, useCallback } from 'react';
import { RootStackProps } from '../../navigation/types';

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
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Pill,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react-native';
import { useMedicationAdherence } from '../../hooks/useMedicationAdherence';

export const MedicationAdherenceScreen = ({ navigation }: RootStackProps<'MedicationAdherence'>) => {
  const { activeDependent } = useUser();
  const {
    statsByMed,
    loading,
    refreshing,
    refresh
  } = useMedicationAdherence(activeDependent?.id ?? "");

  const getColor = (pct: number | null) => {
    if (pct === null) return colors.textSecondary;
    if (pct >= 90) return '#16a34a';
    if (pct >= 70) return '#d97706';
    return '#dc2626';
  };

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
        <Text style={styles.headerTitle}>Adesão a Medicamentos</Text>
        <View style={{ width: 40 }} />
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
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
            <Text style={styles.legendText}>≥ 90% Excelente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#d97706' }]} />
            <Text style={styles.legendText}>70-89% Regular</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.legendText}>&lt; 70% Atenção</Text>
          </View>
        </View>

        {statsByMed.length === 0 && !loading && (
          <View style={styles.empty}>
            <Pill color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>Nenhum dado de adesão</Text>
            <Text style={styles.emptyText}>
              Marque os medicamentos como tomados na Agenda para gerar
              estatísticas.
            </Text>
          </View>
        )}

        {statsByMed.map(
          ({ med, byMonth, overallPct, allTaken, allSkipped, allTotal }) => (
            <View key={med.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Pill color={colors.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{med.name}</Text>
                  {med.dosage ? (
                    <Text style={styles.medDosage}>{med.dosage}</Text>
                  ) : null}
                </View>
                {overallPct !== null && (
                  <View
                    style={[
                      styles.overallBadge,
                      { backgroundColor: `${getColor(overallPct)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.overallPct,
                        { color: getColor(overallPct) },
                      ]}
                    >
                      {overallPct}%
                    </Text>
                    <Text
                      style={[
                        styles.overallLabel,
                        { color: getColor(overallPct) },
                      ]}
                    >
                      geral
                    </Text>
                  </View>
                )}
              </View>

              {allTotal > 0 && (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <CheckCircle color="#16a34a" size={16} />
                    <Text style={styles.statNum}>{allTaken}</Text>
                    <Text style={styles.statLabel}>tomados</Text>
                  </View>
                  <View style={styles.statItem}>
                    <XCircle color="#dc2626" size={16} />
                    <Text style={styles.statNum}>{allSkipped}</Text>
                    <Text style={styles.statLabel}>perdidos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Calendar color={colors.textSecondary} size={16} />
                    <Text style={styles.statNum}>{allTotal}</Text>
                    <Text style={styles.statLabel}>registros</Text>
                  </View>
                </View>
              )}

              {/* Monthly bars */}
              <View style={styles.monthlyRow}>
                {byMonth.map((m: { label: string; pct: number | null }) => (
                  <View key={m.label} style={styles.monthCol}>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: m.pct ? `${m.pct}%` : '4%',
                            backgroundColor: getColor(m.pct),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.monthPct, { color: getColor(m.pct) }]}>
                      {m.pct !== null ? `${m.pct}%` : '–'}
                    </Text>
                    <Text style={styles.monthLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>

              {allTotal === 0 && (
                <Text style={styles.noData}>
                  Nenhum registro nos últimos 3 meses.
                </Text>
              )}
            </View>
          )
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...(typography.caption as object), color: colors.textSecondary },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medName: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  medDosage: { ...(typography.caption as object), color: colors.textSecondary },
  overallBadge: {
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    alignItems: 'center',
  },
  overallPct: { fontSize: 20, fontWeight: '900' as const },
  overallLabel: { ...(typography.caption as object), fontWeight: '600' as const },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statNum: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  statLabel: { ...(typography.caption as object), color: colors.textSecondary },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.m,
    marginTop: spacing.s,
  },
  monthCol: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: {
    width: '100%',
    height: 60,
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 8, minHeight: 4 },
  monthPct: { ...(typography.caption as object), fontWeight: '700' as const, fontSize: 11 },
  monthLabel: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  noData: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.s,
  },
});
