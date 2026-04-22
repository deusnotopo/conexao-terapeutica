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
import { useCrises } from '../../hooks/useCrises';
import {
  ChevronLeft,
  Plus,
  Zap,
  Clock,
  Trash2,
  AlertTriangle,
  Pencil,
} from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';
import { formatLong } from '../../utils/formatDate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SEVERITY_LABELS = [
  '',
  '🟢 Leve',
  '🟡 Moderada',
  '🟠 Intensa',
  '🔴 Severa',
  '🆘 Emergência',
];

const PAGE_SIZE = 20;

export const CrisisScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const {
    events,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
    deleteCrisis,
  } = useCrises(activeDependent?.id ?? "");

  const handleDelete = (ev: any) => {
    webAlert('Excluir Registro', 'Deseja excluir este registro de crise?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteCrisis(ev.id),
      },
    ]);
  };

  // Stats — computed on-the-fly
  const thisMonthCount = events.filter((e: any) => {
    const d = new Date(e.date + 'T12:00:00');
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

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
        <Text style={styles.headerTitle}>Rastreador de Crises</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CrisisForm')}
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
        {/* Monthly Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{events.length}</Text>
            <Text style={styles.summaryLabel}>Total de Registros</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{thisMonthCount}</Text>
            <Text style={styles.summaryLabel}>Neste Mês</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {events.length > 0
                ? Math.round(
                    events.reduce(
                      (sum, e) => sum + (e.duration_minutes || 0),
                      0
                    ) / events.length
                  )
                : 0}
            </Text>
            <Text style={styles.summaryLabel}>Min. Médio</Text>
          </View>
        </View>

        {events.length === 0 && !loading && (
          <View style={styles.empty}>
            <Zap color={colors.border} size={56} />
            <Text style={styles.emptyTitle}>Nenhum episódio registrado</Text>
            <Text style={styles.emptyText}>
              Registre crises para compartilhar dados precisos com o
              neurologista.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('CrisisForm')}
            >
              <Plus color="#fff" size={18} />
              <Text style={styles.emptyBtnText}>Registrar Episódio</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading && !refreshing && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing.xl }}
          />
        )}

        {events.map((ev: any) => (
          <View
            key={ev.id}
            style={[styles.card, ev.severity >= 4 && styles.cardSevere]}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardDate}>
                  {format(
                    new Date(ev.date + 'T12:00:00'),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR }
                  )}
                  {ev.time && ` às ${ev.time.substring(0, 5)}`}
                </Text>
                <Text style={styles.cardType}>{ev.type}</Text>
              </View>
              <View style={styles.cardTopRight}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('CrisisForm', { crisis: ev })
                  }
                  style={styles.editBtn}
                >
                  <Pencil color={colors.primary} size={15} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(ev)}
                  style={styles.deleteBtn}
                >
                  <Trash2 color={colors.error} size={16} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.chips}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {SEVERITY_LABELS[ev.severity] || '—'}
                </Text>
              </View>
              {ev.duration_minutes != null && (
                <View style={styles.chip}>
                  <Clock color={colors.textSecondary} size={12} />
                  <Text style={styles.chipText}>
                    {' '}
                    {ev.duration_minutes} min
                  </Text>
                </View>
              )}
            </View>

            {ev.triggers && (
              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Gatilho: </Text>
                {ev.triggers}
              </Text>
            )}
            {ev.symptoms && (
              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Sintomas: </Text>
                {ev.symptoms}
              </Text>
            )}
            {ev.medication_given && (
              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Med. de Resgate: </Text>
                {ev.medication_given}
              </Text>
            )}
            {ev.notes && <Text style={styles.notes}>{ev.notes}</Text>}
          </View>
        ))}

        {events.length > 0 && (
          <Text style={styles.counter}>
            Exibindo {events.length} de {total} episódio{total !== 1 ? 's' : ''}
          </Text>
        )}
        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={loadMore}
            disabled={loadingMore}
          >
            <Text style={styles.loadMoreText}>
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { fontSize: 32, fontWeight: '900' as const, color: colors.primaryDark },
  summaryLabel: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryDivider: { width: 1, backgroundColor: colors.border },
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
  cardSevere: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  cardDate: { ...(typography.body2 as object), fontWeight: '700' as const, color: colors.text },
  cardType: {
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
  cardTopRight: { flexDirection: 'row', gap: spacing.s },
  counter: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.m,
  },
  loadMoreBtn: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  loadMoreText: {
    ...(typography.body2 as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.s,
    flexWrap: 'wrap',
  },
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
  detail: { ...(typography.body2 as object), color: colors.textSecondary, marginTop: 4 },
  detailLabel: { fontWeight: '700' as const, color: colors.text },
  notes: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.s,
  },
});
