import React, { useState } from 'react';
import { RootStackProps } from '../../navigation/types';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { authService } from '../../services/authService';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Mail, ChevronLeft } from 'lucide-react-native';

export const ForgotPasswordScreen = ({ navigation }: RootStackProps<'ForgotPassword'>) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const result = await authService.resetPassword(email.trim());

    if (result.success) {
      setSuccessMsg(
        'As instruções de recuperação foram enviadas para ' +
          email +
          '. Verifique sua caixa de entrada e spam.'
      );
      setEmail('');
    } else {
      setErrorMsg(result.error || 'Ocorreu um erro. Tente novamente.');
    }
    setLoading(false);
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
        <Text style={styles.headerTitle}>Recuperar Senha</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.iconContainer}>
          <Mail size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Esqueceu sua senha?</Text>
        <Text style={styles.subtitle}>
          Não se preocupe! Digite o e-mail associado à sua conta e enviaremos um
          link para você redefinir sua senha.
        </Text>

        <Input
          label="E-mail de Cadastro"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          placeholder="exemplo@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          icon={<Mail size={20} color={colors.textSecondary} />}
        />

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ {successMsg}</Text>
          </View>
        ) : null}

        <Button
          title={loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          onPress={handleResetPassword}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...(typography.h3 as object),
    color: colors.primaryDark,
  },
  container: {
    flexGrow: 1,
    padding: spacing.l,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: 100,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  title: {
    ...(typography.h1 as object),
    color: colors.primaryDark,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.m,
    lineHeight: 24,
  },
  submitButton: {
    marginTop: spacing.l,
    width: '100%',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: spacing.m,
    marginTop: spacing.s,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...(typography.body2 as object),
    color: colors.error,
    fontWeight: '500' as const,
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: spacing.m,
    marginTop: spacing.s,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successText: {
    ...(typography.body2 as object),
    color: colors.success,
    fontWeight: '500' as const,
  },
});
