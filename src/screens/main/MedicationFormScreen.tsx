import React, { useState, useEffect } from 'react';
import { RootStackProps } from '../../navigation/types';

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
import { MedicationSchema } from '../../lib/schemas';
import { useUser } from '../../context/UserContext';
import { useMedications } from '../../hooks/useMedications';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  Pill,
  Activity,
  Clock,
  ChevronLeft,
  Bell,
  Plus,
  X,
} from 'lucide-react-native';
import { requestNotificationPermission } from '../../lib/notifications';

export const MedicationFormScreen = ({ navigation, route }: RootStackProps<'MedicationForm'>) => {
  const { activeDependent } = useUser();
  const { addMedication, updateMedication } = useMedications(activeDependent?.id ?? "");
  const medication = route.params?.medication || null;
  const isEditing = !!medication;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (isEditing && medication) {
      setName(medication.name || '');
      setDosage(medication.dosage || '');
      setFrequency(medication.frequency_desc || '');
      setReminderTimes(medication.reminder_times || []);
    }
  }, [medication, isEditing]);

  const addTime = () => {
    const trimmed = newTime.trim();
    if (!trimmed.match(/^\d{2}:\d{2}$/)) {
      setErrorMsg('Use o formato HH:MM. Ex: 08:00');
      return;
    }
    if (reminderTimes.includes(trimmed)) {
      setErrorMsg('Horário já adicionado.');
      return;
    }
    setReminderTimes((t) => [...t, trimmed].sort());
    setNewTime('');
    setErrorMsg('');
  };

  const removeTime = (t: string) =>
    setReminderTimes((prev) => prev.filter((x: string) => x !== t));

  const maskTime = (text: string) => {
    let raw = text.replace(/\D/g, '').substring(0, 4);
    if (raw.length > 2) return raw.substring(0, 2) + ':' + raw.substring(2);
    return raw;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Por favor, insira o nome do medicamento.');
      return;
    }
    if (!activeDependent && !isEditing) {
      setErrorMsg('Nenhum dependente selecionado.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      if (reminderTimes.length > 0) {
        await requestNotificationPermission();
      }

      const payload = {
        name: name.trim(),
        dosage: dosage.trim(),
        frequency_desc: frequency.trim(),
        reminder_times: reminderTimes,
        dependent_id: activeDependent?.id,
        is_active: isEditing ? medication.is_active : true,
      };

      // Client-side validation with Zod
      const validation = MedicationSchema.omit({ id: true, created_at: true }).safeParse(payload);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || 'Dados inválidos';
        setErrorMsg(firstError);
        return;
      }

      let result;
      if (isEditing) {
        result = await updateMedication(medication.id, validation.data);
      } else {
        result = await addMedication(validation.data);
      }

      if (result.success) {
        navigation.goBack();
      } else {
        setErrorMsg(result.error ?? "");
      }
    } catch (error: unknown) {
      setErrorMsg('Não foi possível salvar o medicamento.');
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
          {isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KAV
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
        <Input
          label="Nome do Medicamento"
          value={name}
          onChangeText={setName}
          placeholder="Ex: Clobazam"
          icon={<Pill size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Dosagem"
          value={dosage}
          onChangeText={setDosage}
          placeholder="Ex: 5ml ou 1 comprimido"
          icon={<Activity size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Descrição da Frequência"
          value={frequency}
          onChangeText={setFrequency}
          placeholder="Ex: 8h em 8h, uma vez ao dia..."
          icon={<Clock size={20} color={colors.textSecondary} />}
        />

        <View style={styles.remindersSection}>
          <View style={styles.reminderHeader}>
            <Bell color={colors.primary} size={18} />
            <Text style={styles.reminderTitle}>Alarmes de Lembrete</Text>
          </View>
          <Text style={styles.reminderSubtitle}>
            Adicione os horários exatos para receber notificações no navegador.
          </Text>

          <View style={styles.timeRow}>
            <Input
              label=""
              value={newTime}
              onChangeText={(t) => setNewTime(maskTime(t))}
              placeholder="08:00"
              keyboardType="numeric"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
              <Plus color={colors.surface} size={20} />
            </TouchableOpacity>
          </View>

          {reminderTimes.length > 0 && (
            <View style={styles.timeChips}>
              {reminderTimes.map((t: string) => (
                <View key={t} style={styles.timeChip}>
                  <Text style={styles.timeChipText}>🔔 {t}</Text>
                  <TouchableOpacity
                    onPress={() => removeTime(t)}
                    style={styles.removeTime}
                  >
                    <X color={colors.primary} size={14} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Medicamento'}
          onPress={handleSave}
          disabled={loading}
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
    paddingBottom: spacing.xxl,
  },
  remindersSection: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 16,
    padding: spacing.m,
    marginTop: spacing.s,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: 4,
  },
  reminderTitle: {
    ...(typography.body1 as object),
    fontWeight: '700' as const,
    color: colors.primaryDark,
  },
  reminderSubtitle: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  timeRow: { flexDirection: 'row', gap: spacing.s, alignItems: 'center' },
  addTimeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginTop: spacing.m,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    gap: spacing.s,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  timeChipText: {
    ...(typography.body2 as object),
    color: colors.primaryDark,
    fontWeight: '600' as const,
  },
  removeTime: { padding: 2 },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: spacing.s,
    marginTop: spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 14, fontWeight: '500' as const },
  footer: {
    padding: spacing.l,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
