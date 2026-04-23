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
  Dimensions,
} from 'react-native';
import { authService } from '../../services/authService';
import { EmailConfirmationScreen } from './EmailConfirmationScreen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { Eye, EyeOff, LogIn, UserPlus, Sparkles } from 'lucide-react-native';
import { logScreen, logEvent } from '../../lib/firebase';

const CARD_MAX_WIDTH = 480;

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

  // ── Animations ──────────────────────────────────────────────────────────────
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const formFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    logScreen('Login');
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(formFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Re-animate form on mode switch
  useEffect(() => {
    formFadeAnim.setValue(0);
    Animated.timing(formFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [isSignUp]);

  // ── Auth handlers ────────────────────────────────────────────────────────────
  async function signInWithEmail() {
    setErrorMsg('');
    setLoading(true);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Informe e-mail e senha.');
      setLoading(false);
      return;
    }
    const result = await authService.signIn(email, password);
    if (!result.success) {
      setErrorMsg(result.error ?? 'Erro ao fazer login.');
    } else {
      logEvent('login', { method: 'email' });
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setErrorMsg('');
    setLoading(true);
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }
    const result = await authService.signUp(email, password, fullName);
    if (!result.success) {
      setErrorMsg(result.error ?? '');
    } else {
      if (!result.data.session) {
        setWaitingEmailConfirm(true);
      }
      logEvent('sign_up', { method: 'email' });
    }
    setLoading(false);
  }

  const handleSwitch = () => {
    setIsSignUp(v => !v);
    setErrorMsg('');
    setSuccessMsg('');
    setWaitingEmailConfirm(false);
    setPassword('');
  };

  // ── Waiting for email ────────────────────────────────────────────────────────
  if (waitingEmailConfirm) {
    return (
      <EmailConfirmationScreen
        email={email}
        onConfirm={() => { setWaitingEmailConfirm(false); setIsSignUp(false); }}
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
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Header ── */}
          <Animated.View
            style={[
              styles.brandArea,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🦄</Text>
            </View>
            <Text style={styles.appName}>Conexão Terapêutica</Text>
            <Text style={styles.orgName}>Unicórnio Campina Verde</Text>
            <Text style={styles.tagline}>
              A rotina do seu filho, organizada e conectada.
            </Text>
          </Animated.View>

          {/* ── Auth Card ── */}
          <Animated.View style={[styles.card, { opacity: formFadeAnim }]}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: isSignUp ? `${colors.secondary}15` : `${colors.primary}15` }]}>
                {isSignUp
                  ? <UserPlus size={22} color={colors.secondary} />
                  : <LogIn size={22} color={colors.primary} />
                }
              </View>
              <Text style={styles.cardTitle}>
                {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta!'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isSignUp
                  ? 'Preencha seus dados para começar'
                  : 'Entre com seu e-mail e senha'}
              </Text>
            </View>

            {/* Fields */}
            <View style={styles.fields}>
              {isSignUp && (
                <Input
                  label="Nome Completo"
                  onChangeText={(t) => { setFullName(t); setErrorMsg(''); }}
                  value={fullName}
                  placeholder="Ex: Maria Silva"
                  autoCorrect={false}
                />
              )}
              <Input
                label="E-mail"
                onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
                value={email}
                placeholder="email@exemplo.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              <Input
                label="Senha"
                onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
                value={password}
                secureTextEntry={!showPassword}
                placeholder="Mínimo 6 caracteres"
                autoCapitalize="none"
                textContentType={isSignUp ? 'newPassword' : 'password'}
                hint={isSignUp ? 'Use pelo menos 6 caracteres' : undefined}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword
                      ? <EyeOff color={colors.textSecondary} size={20} />
                      : <Eye color={colors.textSecondary} size={20} />
                    }
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Error */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {/* Forgot password */}
            {!isSignUp && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA */}
            <Button
              title={loading ? '...' : isSignUp ? 'Criar Conta' : 'Entrar'}
              onPress={() => (isSignUp ? signUpWithEmail() : signInWithEmail())}
              loading={loading}
              style={styles.primaryBtn}
              accessibilityLabel={isSignUp ? 'Criar conta no app' : 'Entrar no app'}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Switch Login/SignUp */}
            <TouchableOpacity
              onPress={handleSwitch}
              style={styles.switchBtn}
              accessibilityLabel={isSignUp ? 'Já tenho conta' : 'Criar nova conta'}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Já tenho uma conta' : 'Criar nova conta'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tour link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Tutorial')}
            style={styles.tourBtn}
            accessibilityLabel="Ver tour do aplicativo"
          >
            <Sparkles color={colors.textSecondary} size={14} />
            <Text style={styles.tourText}>Conhecer o app antes de entrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xxl,
    width: '100%',
  },

  // ── Brand ──────────────────────────────────────────────────────────────────
  brandArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.primary}18`,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    ...shadows.card,
  },
  logoEmoji: { fontSize: 44 },
  appName: {
    ...(typography.h1 as object),
    fontSize: 28,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  orgName: {
    ...(typography.caption as object),
    fontWeight: '700' as const,
    color: colors.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.s,
  },
  tagline: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.l,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    ...shadows.card,
  },
  cardHeader: { alignItems: 'center', marginBottom: spacing.xl },
  cardHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  cardTitle: {
    ...(typography.h2 as object),
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },

  fields: { marginBottom: spacing.s },

  eyeBtn: { padding: spacing.s },

  errorBox: {
    backgroundColor: '#fff1f2',
    borderRadius: radii.s,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 14, fontWeight: '500' as const },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.m },
  forgotText: {
    ...(typography.body2 as object),
    color: colors.primaryDark,
    fontWeight: '600' as const,
  },

  primaryBtn: { width: '100%' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginVertical: spacing.l,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    ...(typography.caption as object),
    color: colors.textSecondary,
  },

  switchBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.m,
    paddingVertical: spacing.m,
    alignItems: 'center',
  },
  switchText: {
    ...(typography.body2 as object),
    color: colors.text,
    fontWeight: '600' as const,
  },

  // ── Tour ───────────────────────────────────────────────────────────────────
  tourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.xl,
    paddingVertical: spacing.s,
  },
  tourText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
  },
});
