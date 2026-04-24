import React, { useEffect, useState } from 'react';
import { RootStackProps } from '../../navigation/types';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useMedicalRecord } from '../../hooks/useMedicalRecord';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Phone,
  AlertTriangle,
  Heart,
  Shield,
  User,
} from 'lucide-react-native';
import { logScreen, logEvent } from '../../lib/firebase';

export const EmergencyScreen = ({ navigation }: RootStackProps<'Emergency'>) => {
  const { activeDependent } = useUser();
  const { record, loading } = useMedicalRecord(activeDependent?.id ?? "");

  useEffect(() => {
    logScreen('Emergency');
  }, []);

  const call = (phone: string, contactType: string) => {
    if (!phone) return;
    logEvent('emergency_call_attempt', { type: contactType });
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
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
          <ChevronLeft color={colors.surface} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚨 Modo Emergência</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Who */}
        {activeDependent && (
          <View style={styles.whoCard}>
            <User color={colors.surface} size={28} />
            <View>
              <Text style={styles.whoLabel}>Paciente</Text>
              <Text style={styles.whoName}>
                {(activeDependent?.name ?? "")} {""}
              </Text>
              {activeDependent.birth_date && (
                <Text style={styles.whoDetail}>
                  Nascido em{' '}
                  {activeDependent.birth_date.split('-').reverse().join('/')}
                </Text>
              )}
            </View>
          </View>
        )}

        {!loading && !record && (
          <View style={styles.warningBox}>
            <AlertTriangle color="#d97706" size={20} />
            <View style={{ flex: 1, gap: 12 }}>
              <Text style={styles.warningText}>
                Ficha médica não preenchida. Cadastre as informações para
                emergências.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MedicalRecord')}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaButtonText}>Preencher Ficha</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {record && (
          <>
            {/* Blood type & Allergies */}
            <View style={styles.criticalCard}>
              <View style={styles.criticalItem}>
                <Heart color="#dc2626" size={24} />
                <Text style={styles.criticalLabel}>Tipo Sanguíneo</Text>
                <Text style={styles.criticalValue}>
                  {record.blood_type || '—'}
                </Text>
              </View>
            </View>

            {record.allergies ? (
              <View style={styles.allergyCard}>
                <AlertTriangle color="#dc2626" size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.allergyTitle}>⚠️ ALERGIAS</Text>
                  <Text style={styles.allergyText}>{record.allergies}</Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.allergyCard,
                  { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
                ]}
              >
                <Shield color="#16a34a" size={20} />
                <Text style={[styles.allergyText, { color: '#16a34a' }]}>
                  Sem alergias registradas
                </Text>
              </View>
            )}

            {/* Emergency Contact */}
            {(record.emergency_contact_name ||
              record.emergency_contact_phone) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📞 Contato de Emergência
                </Text>
                <View style={styles.contactCard}>
                  <View>
                    <Text style={styles.contactName}>
                      {record.emergency_contact_name || 'Não informado'}
                    </Text>
                    {record.emergency_contact_phone && (
                      <Text style={styles.contactPhone}>
                        {record.emergency_contact_phone}
                      </Text>
                    )}
                  </View>
                  {record.emergency_contact_phone && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => call(record.emergency_contact_phone as string, 'contact')}
                    >
                      <Phone color={colors.surface} size={22} />
                      <Text style={styles.callBtnText}>LIGAR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Primary Physician */}
            {(record.primary_physician_name ||
              record.primary_physician_phone) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍⚕️ Médico Responsável</Text>
                <View style={styles.contactCard}>
                  <View>
                    <Text style={styles.contactName}>
                      {record.primary_physician_name}
                    </Text>
                    {record.primary_physician_phone && (
                      <Text style={styles.contactPhone}>
                        {record.primary_physician_phone}
                      </Text>
                    )}
                  </View>
                  {record.primary_physician_phone && (
                    <TouchableOpacity
                      style={[
                        styles.callBtn,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => call(record.primary_physician_phone as string, 'physician')}
                    >
                      <Phone color={colors.surface} size={22} />
                      <Text style={styles.callBtnText}>LIGAR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Health Plan */}
            {record.health_plan && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛡️ Plano de Saúde</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Operadora</Text>
                  <Text style={styles.infoValue}>{record.health_plan}</Text>
                </View>
                {record.health_plan_number && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nº Carteira</Text>
                    <Text style={styles.infoValue}>
                      {record.health_plan_number}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Notes */}
            {record.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📝 Observações Importantes
                </Text>
                <Text style={styles.notesText}>{record.notes}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* SAMU CTA - Sticky at bottom */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={styles.samuBtn}
          onPress={() => {
            logEvent('emergency_call_attempt', { type: 'samu' });
            Linking.openURL('tel:192');
          }}
        >
          <Phone color={colors.surface} size={24} />
          <Text style={styles.samuText}>Ligar para o SAMU — 192</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7f1d1d' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    height: 60,
    backgroundColor: '#7f1d1d',
  },
  backBtn: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.surface, fontWeight: '800' as const },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  whoCard: {
    flexDirection: 'row',
    gap: spacing.m,
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  whoLabel: { ...(typography.caption as object), color: '#fecaca', fontWeight: '600' as const },
  whoName: { ...(typography.h2 as object), color: colors.surface },
  whoDetail: { ...(typography.body2 as object), color: '#fecaca' },
  warningBox: {
    flexDirection: 'row',
    gap: spacing.m,
    alignItems: 'flex-start',
    backgroundColor: '#fef9c3',
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: { ...(typography.body2 as object), color: '#92400e', flex: 1 },
  criticalCard: {
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: '#fecdd3',
    marginBottom: spacing.m,
    alignItems: 'center',
  },
  criticalItem: { alignItems: 'center', gap: spacing.s },
  criticalLabel: { ...(typography.body2 as object), color: '#9f1239', fontWeight: '700' as const },
  criticalValue: { fontSize: 48, fontWeight: '900' as const, color: '#dc2626' },
  allergyCard: {
    flexDirection: 'row',
    gap: spacing.m,
    alignItems: 'flex-start',
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    marginBottom: spacing.l,
  },
  allergyTitle: {
    ...(typography.body2 as object),
    fontWeight: '800' as const,
    color: '#dc2626',
    marginBottom: 4,
  },
  allergyText: { ...(typography.body1 as object), fontWeight: '600' as const, color: '#7f1d1d' },
  section: { marginBottom: spacing.l },
  sectionTitle: {
    ...(typography.h3 as object),
    fontSize: 16,
    marginBottom: spacing.s,
    color: colors.primaryDark,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactName: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  contactPhone: { ...(typography.body2 as object), color: colors.textSecondary },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  callBtnText: {
    ...(typography.body2 as object),
    color: colors.surface,
    fontWeight: '800' as const,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s,
  },
  infoLabel: { ...(typography.body2 as object), color: colors.textSecondary },
  infoValue: { ...(typography.body2 as object), fontWeight: '600' as const, color: colors.text },
  notesText: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stickyFooter: {
    padding: spacing.m,
    backgroundColor: '#7f1d1d',
    paddingBottom: spacing.xl,
  },
  samuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: spacing.l,
  },
  samuText: { ...(typography.h3 as object), color: colors.surface, fontWeight: '800' as const },
  ctaButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    ...(typography.body2 as object),
    color: colors.surface,
    fontWeight: '700' as const,
  },
});
