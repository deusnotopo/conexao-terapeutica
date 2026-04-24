import React, { useState } from 'react';
import { RootStackProps } from '../../navigation/types';
import { Medication } from '../../lib/schemas';

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
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  Pill,
  CheckCircle,
  XCircle,
  PauseCircle,
  Edit2,
} from 'lucide-react-native';
import { LoadingState } from '../../components/LoadingState';

export const MedicationsScreen = ({ navigation }: RootStackProps<'Medications'>) => {
  const { activeDependent } = useUser();
  const {
    medications,
    loading,
    refreshing,
    refresh,
    updateStock,
    toggleActive,
    deleteMedication,
  } = useMedications(activeDependent?.id ?? '');


  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inactive'

  const handleToggleActive = (med: Medication) => {
    const action = med.is_active ? 'desativar' : 'reativar';
    webAlert(
      `${med.is_active ? 'Desativar' : 'Reativar'} Medicamento`,
      `Deseja ${action} "${med.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => toggleActive(med.id, !med.is_active),
        },
      ]
    );
  };

  const handleDelete = (med: Medication) => {
    webAlert(
      'Excluir Medicamento',
      `Deseja excluir permanentemente "${med.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteMedication(med.id),
        },
      ]
    );
  };

  const handleUpdateStock = (med: Medication, delta: number) => {
    const next = Math.max(0, (med.stock_count || 0) + delta);
    updateStock(med.id, next);
  };

  const displayed = medications.filter((m: Medication) =>
    activeTab === 'active' ? m.is_active : !m.is_active
  );

  if (loading && medications.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Carregando medicamentos..." />
      </SafeAreaView>
    );
  }


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
        <Text style={styles.headerTitle}>Medicamentos</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MedicationForm')}
          style={styles.addBtn}
        >
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={{ backgroundColor: colors.surface }}>
        <View style={styles.tabs}>
          {(['active', 'inactive'] as const).map((tab: string) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === 'active' ? '✅ Ativos' : '⏸ Inativos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
        {displayed.length === 0 && !loading && (
          <View style={styles.empty}>
            <Pill color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active'
                ? 'Nenhum medicamento ativo'
                : 'Nenhum medicamento inativo'}
            </Text>
            {activeTab === 'active' && (
              <Text style={styles.emptyText}>
                Toque no + para adicionar o primeiro.
              </Text>
            )}
          </View>
        )}
        {displayed.map((med: Medication) => {
          const stockLow =
            med.stock_count != null &&
            med.stock_count <= (med.stock_alert_at ?? 5);
          return (
            <View
              key={med.id}
              style={[
                styles.card,
                !med.is_active && styles.cardInactive,
                stockLow && styles.cardLowStock,
              ]}
            >
              <View style={styles.cardIcon}>
                <Pill
                  color={med.is_active ? '#7c3aed' : colors.textSecondary}
                  size={24}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                {med.dosage ? (
                  <Text style={styles.medDetail}>Dose: {med.dosage}</Text>
                ) : null}
                {med.frequency_desc ? (
                  <Text style={styles.medDetail}>🕐 {med.frequency_desc}</Text>
                ) : null}
                {(med.reminder_times || []).length > 0 && (
                  <Text style={styles.medDetail}>
                    🔔 {(med.reminder_times || []).join(' • ')}
                  </Text>
                )}
                {med.stock_count != null && (
                  <View
                    style={[
                      styles.stockRow,
                      { justifyContent: 'space-between', paddingRight: 4 },
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.stockText,
                          stockLow && styles.stockTextLow,
                        ]}
                      >
                        {stockLow ? '⚠️' : '📦'} Estoque: {med.stock_count} un.
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleUpdateStock(med, -1)}
                        style={styles.inlineBtn}
                      >
                        <Text style={styles.inlineBtnText}>-1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleUpdateStock(med, 1)}
                        style={styles.inlineBtn}
                      >
                        <Text style={styles.inlineBtnText}>+1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleUpdateStock(med, 10)}
                        style={styles.inlineBtn}
                      >
                        <Text style={styles.inlineBtnText}>+10</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {med.stock_count == null && med.is_active && (
                  <TouchableOpacity
                    onPress={() => handleUpdateStock(med, 0)}
                    style={styles.stockAddBtn}
                  >
                    <Text style={styles.stockAddText}>+ Rastrear estoque</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('MedicationForm', { medication: med })
                  }
                  style={styles.actionBtn}
                >
                  <Edit2 color={colors.textSecondary} size={22} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleActive(med)}
                  style={styles.actionBtn}
                >
                  {med.is_active ? (
                    <PauseCircle color={colors.secondary} size={22} />
                  ) : (
                    <CheckCircle color={colors.primary} size={22} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(med)}
                  style={styles.actionBtn}
                >
                  <XCircle color={colors.error} size={22} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 12,
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    marginBottom: spacing.xs,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.s,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  tabTextActive: { color: colors.primary },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: { ...(typography.body2 as object), color: colors.textSecondary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.m,
  },
  cardInactive: { opacity: 0.6 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7c3aed15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  medName: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  medDetail: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 3,
  },
  cardActions: { flexDirection: 'row', gap: spacing.s },
  actionBtn: { padding: 4 },
  cardLowStock: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: { ...(typography.caption as object), color: colors.textSecondary, flex: 1 },
  stockTextLow: { color: '#dc2626', fontWeight: '700' as const },
  inlineBtn: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inlineBtnText: {
    ...(typography.caption as object),
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  stockAddBtn: { marginTop: 4 },
  stockAddText: {
    ...(typography.caption as object),
    color: colors.primary,
    fontWeight: '600' as const,
  },
});
