import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { showToast } from '../../components/Toast';
import { useProfessionals } from '../../hooks/useProfessionals';
import { ProfessionalSchema } from '../../lib/schemas';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
} from 'lucide-react-native';

const SPECIALTIES = [
  'Equoterapia',
  'Neuropediatria',
  'Neurologia',
  'Pediatria',
  'Fisioterapia',
  'Fonoaudiologia',
  'T. Ocupacional',
  'Psicologia',
  'Ortopedia',
  'Oftalmologia',
  'Nutrição',
  'Outro',
];

export const ProfessionalFormScreen = ({ navigation, route }: any) => {
  const { activeDependent } = useUser();
  const { addProfessional, updateProfessional } = useProfessionals(activeDependent?.id ?? "");
  const professional = route.params?.professional || null;
  const isEditing = !!professional;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [name, setName] = useState(professional?.name || '');
  const [specialty, setSpecialty] = useState(professional?.specialty || '');
  const [phone, setPhone] = useState(professional?.phone || '');
  const [email, setEmail] = useState(professional?.email || '');
  const [clinic, setClinic] = useState(professional?.clinic || '');
  const [address, setAddress] = useState(professional?.address || '');
  const [notes, setNotes] = useState(professional?.notes || '');
  const [isPrimary, setIsPrimary] = useState(professional?.is_primary || false);

  const handleSave = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        specialty,
        phone: phone.trim() || null,
        email: email.trim() || null,
        clinic: clinic.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        is_primary: isPrimary,
        dependent_id: activeDependent?.id,
      };

      // Client-side validation with Zod
      const validation = ProfessionalSchema.omit({ id: true, created_at: true }).safeParse(payload);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || 'Dados inválidos';
        setErrorMsg(firstError);
        return;
      }

      let result;
      if (isEditing) {
        result = await updateProfessional(professional.id, validation.data);
      } else {
        result = await addProfessional(validation.data);
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
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Profissional' : 'Novo Profissional'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Input
          label="Nome Completo"
          value={name}
          onChangeText={setName}
          placeholder="Dr(a). Nome Sobrenome"
          icon={<User size={20} color={colors.textSecondary} />}
        />

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
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          icon={<Phone size={20} color={colors.textSecondary} />}
        />
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="contato@clinica.com"
          keyboardType="email-address"
          icon={<Mail size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Clínica / Hospital"
          value={clinic}
          onChangeText={setClinic}
          placeholder="Nome da clínica"
          icon={<Stethoscope size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Endereço"
          value={address}
          onChangeText={setAddress}
          placeholder="Rua, número, cidade..."
          icon={<MapPin size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Observações"
          value={notes}
          onChangeText={setNotes}
          placeholder="Horário de atendimento, convênios aceitos..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Médico / Terapeuta Principal</Text>
            <Text style={styles.switchSub}>
              Será destacado no topo do diretório
            </Text>
          </View>
          <Switch
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar ao Diretório'}
          onPress={handleSave}
          loading={loading}
        />
      </View>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: { ...(typography.body2 as object), fontWeight: '600' as const, color: colors.text },
  switchSub: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 2,
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
  footer: {
    padding: spacing.l,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
