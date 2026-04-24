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
import { useVaccines } from '../../hooks/useVaccines';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  Syringe,
  AlertCircle,
  Trash2,
  Calendar,
  Pencil,
} from 'lucide-react-native';
import { formatShort, formatLong } from '../../utils/formatDate';
import { LoadingState } from '../../components/LoadingState';
import { webAlert } from '../../lib/webAlert';
import { Vaccine } from '../../lib/schemas';

const COMMON_VACCINES = [
  'BCG',
  'Hepatite B',
  'Rotavírus',
  'Pentavalente (DTP+Hib+HepB)',
  'Pneumocócica 10V',
  'Meningocócica C',
  'Poliomielite (VIP/VOP)',
  'Febre Amarela',
  'Tríplice Viral (SCR)',
  'Varicela',
  'Hepatite A',
  'HPV',
  'dTpa',
  'Influenza',
  'Outra',
];

export const VaccinesScreen = ({ navigation }: RootStackProps<'Vaccines'>) => {
  const { activeDependent } = useUser();
  const { vaccines, loading, refreshing, refresh, deleteVaccine } = useVaccines(activeDependent?.id ?? "");

  const handleDelete = (v: Vaccine) => {
    webAlert(
      'Excluir Vacina',
      `Deseja excluir o registro de ${v.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteVaccine(v.id),
        },
      ]
    );
  };

  const upcoming = vaccines.filter(
    (v) =>
      v.next_dose_date &&
      v.next_dose_date >= new Date().toISOString().split('T')[0]
  );
  const applied = vaccines.filter((v: Vaccine) => v.applied_date);

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
        <Text style={styles.headerTitle}>Caderneta de Vacinas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('VaccineForm')}
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
        {loading && <LoadingState message="Buscando vacinas..." />}

        {upcoming.length > 0 && (
          <View style={styles.alertCard}>
            <AlertCircle color="#d97706" size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Próximas doses agendadas</Text>
              {upcoming.slice(0, 3).map((v: Vaccine) => (
                <Text key={v.id} style={styles.alertText}>
                  {v.name} — {formatShort(v.next_dose_date)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {vaccines.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Syringe color={colors.border} size={56} />
            <Text style={styles.emptyTitle}>Nenhuma vacina registrada</Text>
            <Text style={styles.emptyText}>
              Acompanhe as vacinas recebidas para manter tudo em dia.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('VaccineForm')}
            >
              <Text style={styles.emptyText}>Registrar vacina</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {applied.length > 0 && (
          <Text style={styles.section}>Vacinas Aplicadas</Text>
        )}
        {applied.map((v: Vaccine) => (
          <View key={v.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <Syringe color={colors.primary} size={22} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.vaccineName}>{v.name}</Text>
              {v.dose_number > 1 && (
                <Text style={styles.vaccineDetail}>Dose {v.dose_number}</Text>
              )}
              <Text style={styles.vaccineDate}>
                📅 {formatLong(v.applied_date)}
              </Text>
              {v.next_dose_date ? (
                <Text style={styles.nextDose}>
                  🔄 Próxima dose: {formatShort(v.next_dose_date)}
                </Text>
              ) : null}
              {v.notes && <Text style={styles.vaccineDetail}>{v.notes}</Text>}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('VaccineForm', { vaccine: v })
                }
                style={styles.editBtn}
              >
                <Pencil color={colors.primary} size={15} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(v)}
                style={styles.deleteBtn}
              >
                <Trash2 color={colors.error} size={15} />
              </TouchableOpacity>
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
  alertCard: {
    flexDirection: 'row',
    gap: spacing.m,
    backgroundColor: '#fef9c3',
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertTitle: {
    ...(typography.body2 as object),
    fontWeight: '700' as const,
    color: '#d97706',
    marginBottom: 4,
  },
  alertText: { ...(typography.caption as object), color: '#92400e' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 50,
  },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: { ...(typography.h3 as object), marginBottom: spacing.m, marginTop: spacing.s },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  vaccineName: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  vaccineDate: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 4,
  },
  nextDose: {
    ...(typography.caption as object),
    color: '#d97706',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  vaccineDetail: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: `${colors.error}10`,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editBtn: {
    padding: 6,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actions: { flexDirection: 'column', gap: spacing.s },
});
