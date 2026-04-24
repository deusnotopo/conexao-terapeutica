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
import { webAlert } from '../../lib/webAlert';
import { useUser } from '../../context/UserContext';
import { syncService } from '../../services/syncService';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  Baby,
  Calendar,
  Stethoscope,
  ChevronLeft,
  Trash2,
} from 'lucide-react-native';

export const EditDependentScreen = ({ navigation, route }: RootStackProps<'EditDependent'>) => {
  const { dependent } = route.params;
  const { refreshContext, setActiveDependent } = useUser();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extrair YYYY-MM-DD para DD/MM/AAAA para exibir no input
  const initialDateParts = dependent.birth_date
    ? dependent.birth_date.split('-')
    : [];
  const initialFormattedDate =
    initialDateParts.length === 3
      ? `${initialDateParts[2]}/${initialDateParts[1]}/${initialDateParts[0]}`
      : dependent.birth_date;

  // Parse name into first/last for UI display
  const nameParts = (dependent.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [birthDate, setBirthDate] = useState<string>(initialFormattedDate ?? '');
  const [diagnosis, setDiagnosis] = useState(dependent.diagnosis || '');

  const handleDateChange = (text: string) => {
    let raw = text.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);
    let masked = raw;
    if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
    if (raw.length > 4)
      masked = masked.substring(0, 5) + '/' + raw.substring(4);
    setBirthDate(masked);
    setErrorMsg('');
  };

  const handleUpdate = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      setErrorMsg('Por favor, preencha o nome e a data de nascimento.');
      return;
    }
    const dateParts = birthDate.split('/');
    if (dateParts.length !== 3 || dateParts[2].length !== 4) {
      setErrorMsg('A data de nascimento deve estar no formato DD/MM/AAAA.');
      return;
    }
    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    setErrorMsg('');
    setLoading(true);
    try {
      const result = await syncService.perform('dependentService', 'updateDependent', [
        dependent.id,
        {
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          birth_date: isoDate,
          diagnosis: diagnosis.trim() || null,
        },
      ]);

      if (result.success) {
        await refreshContext();
        navigation.goBack();
      } else {
        setErrorMsg(result.error || 'Não foi possível salvar as alterações.');
      }
    } catch (error: unknown) {
      setErrorMsg('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    webAlert(
      'Excluir Perfil',
      `Deseja realmente excluir o perfil de "${dependent.name}"? Esta ação é permanente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await syncService.perform('dependentService', 'deleteDependent', [
                dependent.id,
              ]);

              if (result.success) {
                await refreshContext();
                navigation.popToTop();
              } else {
                setErrorMsg(result.error || 'Não foi possível excluir o perfil.');
              }
            } catch (error: unknown) {
              setErrorMsg('Erro ao excluir dependente.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 color={colors.error} size={24} />
        </TouchableOpacity>
      </View>

      <KAV
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Input
            label="Nome"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ex: João"
            icon={<Baby size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Sobrenome"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Ex: Silva"
          />
          <Input
            label="Data de Nascimento (DD/MM/AAAA)"
            value={birthDate}
            onChangeText={handleDateChange}
            placeholder="Ex: 25/11/2020"
            keyboardType="numeric"
            icon={<Calendar size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Diagnóstico"
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="Ex: TEA, TDAH, etc."
            icon={<Stethoscope size={20} color={colors.textSecondary} />}
          />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}
        <Button
          title={loading ? 'Salvando...' : 'Salvar Alterações'}
          onPress={handleUpdate}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
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
  deleteButton: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: spacing.xxl,
  },
  form: { width: '100%', marginBottom: spacing.l },
  button: { width: '100%', marginTop: spacing.m },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: spacing.s,
    marginTop: spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 14, fontWeight: '500' as const },
});
