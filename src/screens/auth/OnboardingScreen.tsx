import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { syncService } from '../../services/syncService';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Baby, Calendar, Stethoscope, Heart } from 'lucide-react-native';

import { webAlert } from '../../lib/webAlert';

export const OnboardingScreen = ({ navigation }: any) => {
  const { user, refreshContext } = useUser();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const handleDateChange = (text) => {
    let raw = text.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);
    let masked = raw;
    if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
    if (raw.length > 4)
      masked = masked.substring(0, 5) + '/' + raw.substring(4);
    setBirthDate(masked);
    setErrorMsg('');
  };

  const handleCompleteOnboarding = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      setErrorMsg(
        'Por favor, preencha o nome e a data de nascimento do seu pequeno.'
      );
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
      const result = await syncService.perform('dependentService', 'createDependent', [{
        primary_user_id: user?.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: isoDate,
        diagnosis: diagnosis.trim(),
      }]);

      if (!result.success && !result.metadata?.enqueued) {
        setErrorMsg(result.error || 'Não foi possível salvar os dados.');
        return;
      }

      // refreshContext updates dependents state → Navigator re-renders automatically
      await refreshContext();
      // Fallback explicit navigation for web environments
      setTimeout(() => {
        try {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } catch (_) {}
      }, 300);
    } catch (error) {
      const msg = (error as Error)?.message || 'Não foi possível salvar os dados. Verifique a conexão.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Heart color={colors.primary} size={40} fill={colors.primary} />
            </View>
            <Text style={styles.title}>Bem-vindo(a)!</Text>
            <Text style={styles.subtitle}>
              Para começar, vamos cadastrar o perfil do seu pequeno.
            </Text>
          </View>

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
              label="Diagnóstico (Opcional)"
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
            title={loading ? 'Salvando...' : 'Começar Minha Jornada'}
            onPress={handleCompleteOnboarding}
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.footerText}>
            Você poderá adicionar outros dependentes ou convidar familiares
            depois.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.xl,
    alignItems: 'center',
    paddingBottom: 120,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: spacing.s,
    marginTop: spacing.s,
    marginBottom: spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    width: '100%',
  },
  errorText: { color: colors.error, fontSize: 14, fontWeight: '500' as const },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: { ...(typography.h1 as object), color: colors.primaryDark, textAlign: 'center' },
  subtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.s,
    paddingHorizontal: spacing.m,
  },
  form: { width: '100%', marginBottom: spacing.l },
  button: { width: '100%', marginTop: spacing.m },
  footerText: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.l,
  },
});
