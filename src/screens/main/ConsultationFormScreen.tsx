import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAvoidingView as KAV, Platform } from 'react-native';
import { showToast } from '../../components/Toast';
import { ConsultationSchema } from '../../lib/schemas';
import { useUser } from '../../context/UserContext';
import { useAgenda } from '../../hooks/useAgenda';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Stethoscope, User, Calendar } from 'lucide-react-native';

const SPECIALTIES = [
  'Equoterapia',
  'Neuropediatria',
  'Fisioterapia',
  'Fonoaudiologia',
  'Terapia Ocupacional',
  'Pediatria',
  'Psicologia',
  'Ortopedia',
  'Outro',
];

const toDisplay = (iso: any) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const toISO = (masked: any) => {
  const p = masked.split('/');
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null;
};

export const ConsultationFormScreen = ({ navigation, route }: any) => {
  const { activeDependent } = useUser();
  const { addConsultation, updateConsultation } = useAgenda(activeDependent?.id ?? "");
  const consultation = route.params?.consultation || null;
  const isEditing = !!consultation;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [specialty, setSpecialty] = useState(consultation?.specialty || '');
  const [date, setDate] = useState(toDisplay(consultation?.date) || '');
  const [physicianName, setPhysicianName] = useState(consultation?.physician_name || '');
  const [cidCode, setCidCode] = useState(consultation?.cid_code || '');
  const [notes, setNotes] = useState(consultation?.notes || '');
  const [nextAppointment, setNextAppointment] = useState(toDisplay(consultation?.next_appointment) || '');

  const handleDateChange = (text: any, setter: any) => {
    let raw = text.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);
    let masked = raw;
    if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
    if (raw.length > 4)
      masked = masked.substring(0, 5) + '/' + raw.substring(4);
    setter(masked);
  };
  const handleSave = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const isoDate = toISO(date);
      const payload = {
        specialty,
        date: isoDate,
        physician_name: physicianName.trim() || null,
        cid_code: cidCode.trim() || null,
        notes: notes.trim() || null,
        next_appointment: nextAppointment ? toISO(nextAppointment) : null,
        dependent_id: activeDependent?.id,
      };

      // Client-side validation with Zod
      const validation = ConsultationSchema.omit({ id: true, created_at: true }).safeParse(payload);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || 'Dados inválidos';
        setErrorMsg(firstError);
        return;
      }

      let result;
      if (isEditing) {
        result = await updateConsultation(consultation.id, validation.data);
      } else {
        result = await addConsultation(validation.data);
      }

      if (result.success) {
        navigation.goBack();
      } else {
        setErrorMsg(result.error ?? "");
      }
    } catch (e: any) {
      setErrorMsg('Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Consulta' : 'Nova Consulta'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KAV
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Especialidade</Text>
        <View style={styles.chips}>
          {SPECIALTIES.map((s: any) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, specialty === s && styles.chipActive]}
              onPress={() => setSpecialty(s)}
            >
              <Text
                style={[
                  styles.chipText,
                  specialty === s && styles.chipTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input
          label="Data da Consulta (DD/MM/AAAA)"
          value={date}
          onChangeText={(t) => handleDateChange(t, setDate)}
          placeholder="Ex: 18/03/2026"
          keyboardType="numeric"
          icon={<Calendar size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Nome do Médico (Opcional)"
          value={physicianName}
          onChangeText={setPhysicianName}
          placeholder="Dr(a). ..."
          icon={<User size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Código CID (Opcional)"
          value={cidCode}
          onChangeText={setCidCode}
          placeholder="Ex: F84.0"
          icon={<Stethoscope size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Observações / Orientações"
          value={notes}
          onChangeText={setNotes}
          placeholder="O que o médico recomendou..."
          multiline
          numberOfLines={4}
        />
        <Input
          label="Data do Próximo Retorno (DD/MM/AAAA)"
          value={nextAppointment}
          onChangeText={(t) => handleDateChange(t, setNextAppointment)}
          placeholder="Ex: 18/06/2026"
          keyboardType="numeric"
          icon={<Calendar size={20} color={colors.textSecondary} />}
        />
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Consulta'}
          onPress={handleSave}
          loading={loading}
        />
      </View>
      </KAV>
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
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  label: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.s,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
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
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: spacing.m,
    marginVertical: spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontWeight: '500' as const },
  footer: {
    padding: spacing.l,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
