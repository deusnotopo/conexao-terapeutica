import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { useExpenses } from '../../hooks/useExpenses';
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
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  DollarSign,
  TrendingUp,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORY_COLORS = {
  Consulta: '#7c3aed',
  Terapia: colors.primary,
  Remédio: '#dc2626',
  Exame: '#d97706',
  Transporte: '#2563eb',
  Equipamento: '#0891b2',
  Outro: colors.textSecondary,
};

const formatCurrency = (cents: any) => {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
};

export const ExpensesScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const {
    expenses,
    totalMonthCents,
    totalCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    removeExpense,
  } = useExpenses(activeDependent?.id ?? "");

  const handleDelete = (expense: any) => {
    webAlert(
      'Excluir Gasto',
      `Deseja excluir este gasto de ${formatCurrency(expense.amount_cents)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const ok = await removeExpense(expense.id); if (!ok) {
            }
          },
        },
      ]
    );
  };

  const grouped = expenses.reduce((acc: any, e: any) => {
    const month = e.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(e);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gastos com Saúde</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ExpenseForm')}
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
        <View style={styles.summaryCard}>
          <TrendingUp color={colors.primary} size={24} />
          <View>
            <Text style={styles.summaryLabel}>Gasto este mês</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalMonthCents)}
            </Text>
          </View>
        </View>

        {loading && !refreshing && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing.xl }}
          />
        )}

        {/* Category Breakdown */}
        {expenses.length > 0 &&
          (() => {
            const cats = Object.entries(
              expenses.reduce((acc: any, e: any) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount_cents;
                return acc;
              }, {})
            ).sort((a: any, b: any) => b[1] - a[1]);
            const total = cats.reduce((s: number, [, v]: any) => s + (v as number), 0);
            return (
              <View style={styles.catCard}>
                <Text style={styles.catTitle}>📊 Por Categoria (total)</Text>
                {cats.map(([cat, val]: any) => {
                  const pct = total > 0 ? (val / total) * 100 : 0;
                  const col = (CATEGORY_COLORS as any)[cat] || colors.textSecondary;
                  return (
                    <View key={cat} style={styles.catRow}>
                      <Text style={[styles.catLabel, { color: col }]}>
                        {cat}
                      </Text>
                      <View style={styles.catBarBg}>
                        <View
                          style={[
                            styles.catBar,
                            { width: `${pct}%`, backgroundColor: col },
                          ]}
                        />
                      </View>
                      <Text style={styles.catValue}>{formatCurrency(val)}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}

        {expenses.length === 0 && !loading ? (
          <View style={styles.empty}>
            <DollarSign color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>Nenhum gasto registrado</Text>
            <Text style={styles.emptyText}>
              Toque no + para registrar o primeiro gasto.
            </Text>
          </View>
        ) : null}

        {Object.entries(grouped).map(([month, items]: any) => {
          const monthTotal = items.reduce((s: any, e: any) => s + e.amount_cents, 0);
          const [year, m] = month.split('-');
          const label = format(
            new Date(Number(year), Number(m) - 1, 1),
            'MMMM yyyy',
            { locale: ptBR }
          );
          return (
            <View key={month}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthLabel}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </Text>
                <Text style={styles.monthTotal}>
                  {formatCurrency(monthTotal)}
                </Text>
              </View>
              {items.map((e: any) => (
                <View key={e.id} style={styles.card}>
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor:
                          (CATEGORY_COLORS as any)[e.category] || colors.textSecondary,
                      },
                    ]}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.categoryLabel}>{e.category}</Text>
                    {e.description ? (
                      <Text style={styles.description}>{e.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.amount}>
                      {formatCurrency(e.amount_cents)}
                    </Text>
                    {e.reimbursable && (
                      <Text
                        style={[
                          styles.badge,
                          e.reimbursed ? styles.badgeGreen : styles.badgeOrange,
                        ]}
                      >
                        {e.reimbursed ? 'Reembolsado' : 'Reembolsável'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('ExpenseForm', { expense: e })
                      }
                      style={[styles.deleteBtn, { backgroundColor: '#f1f5f9' }]}
                    >
                      <Edit2 color={colors.textSecondary} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(e)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 color={colors.error} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {expenses.length > 0 && (
          <Text style={styles.counter}>
            Exibindo {expenses.length} de {totalCount} gasto{totalCount !== 1 ? 's' : ''}
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
  backButton: { padding: 4 },
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
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  summaryLabel: { ...(typography.caption as object), color: colors.textSecondary },
  summaryValue: { ...(typography.h2 as object), color: colors.primaryDark },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  monthLabel: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  monthTotal: {
    ...(typography.body1 as object),
    fontWeight: '700' as const,
    color: colors.primaryDark,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.m,
  },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  cardInfo: { flex: 1 },
  categoryLabel: { ...(typography.body2 as object), fontWeight: '600' as const, color: colors.text },
  description: { ...(typography.caption as object), color: colors.textSecondary },
  cardRight: { alignItems: 'flex-end' },
  amount: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  badge: {
    ...(typography.caption as object),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  badgeGreen: { backgroundColor: '#dcfce7', color: '#16a34a' },
  badgeOrange: { backgroundColor: '#fef9c3', color: '#d97706' },
  catCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catTitle: {
    ...(typography.body2 as object),
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: spacing.m,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  catLabel: { width: 80, ...(typography.caption as object), fontWeight: '700' as const },
  catBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBar: { height: 8, borderRadius: 4, minWidth: 4 },
  catValue: {
    ...(typography.caption as object),
    fontWeight: '600' as const,
    color: colors.text,
    width: 75,
    textAlign: 'right',
  },
  cardActions: { flexDirection: 'column', gap: 6 },
  deleteBtn: {
    padding: 6,
    backgroundColor: `${colors.error}10`,
    borderRadius: 8,
  },
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
});
