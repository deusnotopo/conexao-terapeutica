import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { KeyboardAvoidingView as KAV, Platform } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useMedicalRecord } from '../../hooks/useMedicalRecord';
import { useResponsive } from '../../utils/responsive';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  ChevronLeft,
  Heart,
  Pill,
  Shield,
  Phone,
  User,
  FileText,
  Save,
  Edit2,
} from 'lucide-react-native';

const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Não sei',
];

export const MedicalRecordScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const { isSmall, isTablet, hPad } = useResponsive();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { record: fetchedRecord, loading, saveRecord } = useMedicalRecord(activeDependent?.id ?? "");
  const [record, setRecord] = useState({
    blood_type: '',
    health_plan: '',
    health_plan_number: '',
    allergies: '',
    primary_physician_name: '',
    primary_physician_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  });

  useEffect(() => {
    if (fetchedRecord) {
      setRecord(fetchedRecord as any);
      setEditing(false);
    } else if (!loading) {
      setEditing(true);
    }
  }, [fetchedRecord, loading]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    const success = await saveRecord(record);
    if (success) {
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCall = (phone: any) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  };

  const update = (field: any, val: any) => setRecord((r) => ({ ...r, [field]: val }));

  const Section = ({ icon, title, children }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

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
        <Text style={styles.headerTitle}>Ficha Médica</Text>
        {!editing ? (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={styles.editButton}
          >
            <Edit2 color={colors.primary} size={20} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KAV
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView 
        style={[isTablet && { alignSelf: 'center', width: '100%', maxWidth: 800 }]} 
        contentContainerStyle={[styles.container, { paddingHorizontal: hPad }]}
        keyboardShouldPersistTaps="handled">
        {activeDependent && (
          <View style={styles.patientCard}>
            <Heart
              color={colors.primary}
              size={24}
              fill={`${colors.primary}40`}
            />
            <Text style={styles.patientName}>
              {activeDependent?.name ?? "—"} {""}
            </Text>
          </View>
        )}

        <Section
          icon={<Heart color={colors.error} size={18} />}
          title="Dados Vitais"
        >
          {editing ? (
            <>
              <Text style={styles.label}>Tipo Sanguíneo</Text>
              <View style={styles.bloodTypeRow}>
                {BLOOD_TYPES.map((bt: any) => (
                  <TouchableOpacity
                    key={bt}
                    style={[
                      styles.chip,
                      record.blood_type === bt && styles.chipActive,
                    ]}
                    onPress={() => update('blood_type', bt)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        record.blood_type === bt && styles.chipTextActive,
                      ]}
                    >
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label="Alergias"
                value={record.allergies}
                onChangeText={(v) => update('allergies', v)}
                placeholder="Ex: Dipirona, Amendoim, Látex..."
                multiline
                numberOfLines={3}
              />
            </>
          ) : (
            <>
              <InfoRow label="Tipo Sanguíneo" value={record.blood_type} />
              <InfoRow label="Alergias" value={record.allergies} />
            </>
          )}
        </Section>

        <Section
          icon={<Shield color={colors.secondary} size={18} />}
          title="Plano de Saúde"
        >
          {editing ? (
            <>
              <Input
                label="Operadora"
                value={record.health_plan}
                onChangeText={(v) => update('health_plan', v)}
                placeholder="Ex: Unimed, SUS, Particular..."
              />
              <Input
                label="Nº da Carteira / Beneficiário"
                value={record.health_plan_number}
                onChangeText={(v) => update('health_plan_number', v)}
                placeholder="0000 0000 0000"
              />
            </>
          ) : (
            <>
              <InfoRow label="Operadora" value={record.health_plan} />
              <InfoRow label="Nº Carteira" value={record.health_plan_number} />
            </>
          )}
        </Section>

        <Section
          icon={<User color={colors.primary} size={18} />}
          title="Médico Principal"
        >
          {editing ? (
            <>
              <Input
                label="Nome do Médico"
                value={record.primary_physician_name}
                onChangeText={(v) => update('primary_physician_name', v)}
                placeholder="Dr(a). ..."
              />
              <Input
                label="Telefone"
                value={record.primary_physician_phone}
                onChangeText={(v) => update('primary_physician_phone', v)}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
            </>
          ) : (
            <>
              <InfoRow label="Nome" value={record.primary_physician_name} />
              <CallRow
                label="Telefone"
                value={record.primary_physician_phone}
                onCall={() => handleCall(record.primary_physician_phone)}
              />
            </>
          )}
        </Section>

        <Section
          icon={<Phone color={colors.error} size={18} />}
          title="Contato de Emergência"
        >
          {editing ? (
            <>
              <Input
                label="Nome do Contato"
                value={record.emergency_contact_name}
                onChangeText={(v) => update('emergency_contact_name', v)}
                placeholder="Nome completo..."
              />
              <Input
                label="Telefone de Emergência"
                value={record.emergency_contact_phone}
                onChangeText={(v) => update('emergency_contact_phone', v)}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
            </>
          ) : (
            <>
              <InfoRow label="Nome" value={record.emergency_contact_name} />
              <CallRow
                label="Telefone"
                value={record.emergency_contact_phone}
                onCall={() => handleCall(record.emergency_contact_phone)}
              />
            </>
          )}
        </Section>

        <Section
          icon={<FileText color={colors.textSecondary} size={18} />}
          title="Observações Gerais"
        >
          {editing ? (
            <Input
              label=""
              value={record.notes}
              onChangeText={(v) => update('notes', v)}
              placeholder="Informações adicionais importantes..."
              multiline
              numberOfLines={4}
            />
          ) : (
            <InfoRow label="" value={record.notes} />
          )}
        </Section>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {editing && (
          <Button
            title={saving ? 'Salvando...' : 'Salvar Ficha Médica'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        )}
      </ScrollView>
      </KAV>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    {label ? <Text style={styles.infoLabel}>{label}</Text> : null}
    <Text style={styles.infoValue}>
      {value || <Text style={styles.emptyValue}>Não informado</Text>}
    </Text>
  </View>
);

const CallRow = ({ label, value, onCall }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={styles.infoValue}>
        {value || <Text style={styles.emptyValue}>Não informado</Text>}
      </Text>
      {value ? (
        <TouchableOpacity onPress={onCall} style={styles.callButton}>
          <Phone color={colors.surface} size={14} />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

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
  editButton: {
    padding: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 10,
  },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    flexGrow: 1,
    paddingVertical: spacing.l,
    paddingBottom: 120,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  patientName: { ...(typography.h3 as object), color: colors.primaryDark, flex: 1 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  sectionTitle: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  label: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.s,
  },
  bloodTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    ...(typography.caption as object),
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.surface },
  infoRow: {
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: { ...(typography.body1 as object), color: colors.text, fontWeight: '500' as const },
  emptyValue: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontWeight: '400' as const,
  },
  callButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: spacing.m,
    marginVertical: spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontWeight: '500' as const },
  saveBtn: { marginTop: spacing.m },
});
