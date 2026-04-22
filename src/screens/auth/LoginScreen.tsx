import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { authService } from '../../services/authService';
import { EmailConfirmationScreen } from './EmailConfirmationScreen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, spacing, typography } from '../../theme';
import { Eye, EyeOff } from 'lucide-react-native';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [waitingEmailConfirm, setWaitingEmailConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function signInWithEmail() {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (email.trim() === '' || password.trim() === '') {
      setErrorMsg('Informe e-mail e senha.');
      setLoading(false);
      return;
    }

    const result = await authService.signIn(email, password);
    if (!result.success) {
      setErrorMsg(result.error ?? 'Erro ao fazer login.');
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    const result = await authService.signUp(email, password, fullName);
    if (!result.success) {
      setErrorMsg(result.error);
    } else {
      if (!result.data.session) {
        setWaitingEmailConfirm(true);
      }
    }
    setLoading(false);
  }

  const handleSwitch = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setSuccessMsg('');
    setWaitingEmailConfirm(false);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (waitingEmailConfirm) {
    return (
      <EmailConfirmationScreen
        email={email}
        onConfirm={() => {
          setWaitingEmailConfirm(false);
          setIsSignUp(false);
          setSuccessMsg('');
        }}
        onBack={() => setWaitingEmailConfirm(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Branding */}
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🦄</Text>
            </View>
            <Text style={styles.appName}>Conexão Terapêutica</Text>
            <Text style={styles.subtitle}>Unicórnio Campina Verde</Text>
            <Text style={styles.tagline}>
              A rotina do seu filho, organizada e conectada.
            </Text>
          </Animated.View>

          <View style={styles.formContainer}>
            {isSignUp && (
              <Input
                label="Nome Completo"
                onChangeText={(text) => {
                  setFullName(text);
                  setErrorMsg('');
                }}
                value={fullName}
                placeholder="Seu nome"
              />
            )}
            <Input
              label="E-mail"
              onChangeText={(text) => {
                setEmail(text);
                setErrorMsg('');
              }}
              value={email}
              placeholder="email@exemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Senha"
              onChangeText={(text) => {
                setPassword(text);
                setErrorMsg('');
              }}
              value={password}
              secureTextEntry={!showPassword}
              placeholder="Mínimo 6 caracteres"
              autoCapitalize="none"
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
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
          </View>

          <View style={styles.buttonsContainer}>
            {!isSignUp && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            )}
            <Button
              title={isSignUp ? 'Criar Conta' : 'Entrar'}
              onPress={() => (isSignUp ? signUpWithEmail() : signInWithEmail())}
              loading={loading}
              accessibilityLabel={
                isSignUp ? 'Criar conta no app' : 'Entrar no app'
              }
            />

            <TouchableOpacity
              onPress={handleSwitch}
              style={styles.toggleButton}
              accessibilityLabel={
                isSignUp ? 'Alternar para login' : 'Alternar para cadastro'
              }
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Já tem uma conta? Entre aqui'
                  : 'Não tem conta? Cadastre-se'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Tutorial')}
              style={styles.tourButton}
              accessibilityLabel="Ver tour completo do aplicativo"
            >
              <Text style={styles.tourText}>🦄 Ver tour completo do app</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.l,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    ...(typography.h1 as object),
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...(typography.caption as object),
    fontWeight: '700' as const,
    color: colors.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.s,
  },
  tagline: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    marginBottom: spacing.l,
  },
  buttonsContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    gap: spacing.s,
  },
  toggleButton: {
    marginTop: spacing.m,
    alignItems: 'center',
  },
  toggleText: {
    ...(typography.body2 as object),
    color: colors.primary,
    fontWeight: '600' as const,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.s,
  },
  forgotPasswordText: {
    ...(typography.body2 as object),
    color: colors.primaryDark,
    fontWeight: '600' as const,
  },
  tourButton: {
    marginTop: spacing.m,
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  tourText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: spacing.s,
    marginTop: spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: spacing.s,
    marginTop: spacing.s,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
