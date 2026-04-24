import React, { useState, useEffect } from 'react';
import { RootStackProps } from '../../navigation/types';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { syncService } from '../../services/syncService';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Baby, Calendar, Stethoscope, Heart } from 'lucide-react-native';

import { logScreen, logEvent } from '../../lib/firebase';
import { useResponsive } from '../../utils/responsive';

type OnboardingScreenProps = RootStackProps<'Onboarding'> | RootStackProps<'AddDependent'>;

export const OnboardingScreen = ({ navigation, route }: OnboardingScreenProps) => {
  const isModal = (route?.name as string) === 'AddDependent';
  const { user, refreshContext } = useUser();
  const { isSmall, isTablet, hPad, cardPad } = useResponsive();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const lastNameRef = React.useRef<TextInput>(null);
  const birthDateRef = React.useRef<TextInput>(null);
  const diagnosisRef = React.useRef<TextInput>(null);

  useEffect(() => {
    logScreen(isModal ? 'AddDependent' : 'Onboarding');
  }, [isModal]);

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

  const handleCompleteOnboarding = async () => {
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      setErrorMsg('Por favor, preencha o nome e a data de nascimento do seu pequeno.');
      return;
    }

    const dateParts = birthDate.split('/');
    if (dateParts.length !== 3 || dateParts[2].length !== 4) {
      setErrorMsg('A data de nascimento deve estar no formato DD/MM/AAAA.');
      return;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const year = parseInt(dateParts[2], 10);

    // Basic date bound validation
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      setErrorMsg('Data de nascimento inválida.');
      return;
    }

    // Advanced: Check days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
       setErrorMsg('O dia informado não existe para este mês.');
       return;
    }

    // Future date validation
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    // Reset today's time so we only compare the date portion
    today.setHours(0, 0, 0, 0);

    if (inputDate > today) {
       setErrorMsg('Você não pode cadastrar uma data no futuro.');
       return;
    }

    if (year < 1920) {
       setErrorMsg('Ano de nascimento inválido.');
       return;
    }

    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    setErrorMsg('');
    setLoading(true);
    try {
      const result = await syncService.perform('dependentService', 'createDependent', [{
        user_id: user?.id,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        birth_date: isoDate,
        diagnosis: diagnosis.trim() || null,
      }]);

      if (!result.success && !(result.metadata as { enqueued?: boolean })?.enqueued) {
        setErrorMsg(result.error || 'Não foi possível salvar os dados.');
        return;
      }

      logEvent('onboarding_completed', { type: isModal ? 'extra' : 'initial' });

      await refreshContext();
      if (isModal) {
        navigation.goBack();
      } else {
        setTimeout(() => {
          try {
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          } catch (_: unknown) {}
        }, 300);
      }
    } catch (error: unknown) {
      const msg = (error as Error)?.message || 'Não foi possível salvar os dados. Verifique a conexão.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const showCard = isTablet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/*
          Removed alignItems: 'center' from contentContainerStyle.
          It causes layout/scroll breaking on mobile web. We center items below using an inner View constraint.
        */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: hPad },
            isSmall && { paddingVertical: spacing.l }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Inner centering wrapper */}
          <View style={[styles.innerWrapper, showCard && styles.cardWrapper, showCard && { padding: cardPad }]}>

            <View style={[styles.header, isSmall && { marginBottom: spacing.l }]}>
              <View style={[styles.iconCircle, isSmall && styles.iconCircleSmall]}>
                <Heart color={colors.primary} size={isSmall ? 32 : 40} fill={colors.primary} />
              </View>
              <Text style={[styles.title, isSmall && { fontSize: 24 }]}>
                Bem-vindo(a)!
              </Text>
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
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                blurOnSubmit={false}
                icon={<Baby size={20} color={colors.textSecondary} />}
                maxLength={40}
              />
              <Input
                ref={lastNameRef}
                label="Sobrenome"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ex: Silva"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => birthDateRef.current?.focus()}
                blurOnSubmit={false}
                maxLength={60}
              />
              <Input
                ref={birthDateRef}
                label="Data de Nascimento (DD/MM/AAAA)"
                value={birthDate}
                onChangeText={handleDateChange}
                placeholder="Ex: 25/11/2020"
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => diagnosisRef.current?.focus()}
                blurOnSubmit={false}
                icon={<Calendar size={20} color={colors.textSecondary} />}
              />
              <Input
                ref={diagnosisRef}
                label="Diagnóstico (Opcional)"
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="Ex: TEA, TDAH, etc."
                returnKeyType="done"
                onSubmitEditing={handleCompleteOnboarding}
                icon={<Stethoscope size={20} color={colors.textSecondary} />}
                maxLength={100}
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
              Você poderá adicionar outros dependentes ou convidar familiares depois.
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
    paddingBottom: 120, // keep space for keyboard
  },

  // Centralizes content without breaking scroll view bounds
  innerWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  cardWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radii.l,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    flex: 0, // don't stretch card to full height
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
  iconCircleSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  title: {
    ...(typography.h1 as object),
    color: colors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.s,
  },

  form: { width: '100%', marginBottom: spacing.l },

  button: { width: '100%', marginTop: spacing.s },

  errorBox: {
    backgroundColor: '#fff1f2',
    borderRadius: radii.s,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 14, fontWeight: '500' as const },

  footerText: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
