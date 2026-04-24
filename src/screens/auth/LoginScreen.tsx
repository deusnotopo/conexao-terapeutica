import React, { useState, useEffect, useRef } from 'react';
import { RootStackProps } from '../../navigation/types';

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
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { Eye, EyeOff, LogIn, UserPlus, Sparkles } from 'lucide-react-native';
import { logScreen, logEvent } from '../../lib/firebase';
import { useResponsive } from '../../utils/responsive';

export const LoginScreen = ({ navigation }: RootStackProps<'Login'>) => {
  const { isSmall, isTablet, hPad, cardPad } = useResponsive();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [fullName, setFullName]   = useState('');
  const [isSignUp, setIsSignUp]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [waitingEmailConfirm, setWaitingEmailConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Animations ──────────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const formFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    logScreen('Login');
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(formFade, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    formFade.setValue(0);
    Animated.timing(formFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [isSignUp]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
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
      if (!result.data?.session) setWaitingEmailConfirm(true);
      logEvent('sign_up', { method: 'email' });
    }
    setLoading(false);
  }

  const handleSwitch = () => {
    setIsSignUp(v => !v);
    setErrorMsg('');
    setPassword('');
    setWaitingEmailConfirm(false);
  };

  if (waitingEmailConfirm) {
    return (
      <EmailConfirmationScreen
        email={email}
        onConfirm={() => { setWaitingEmailConfirm(false); setIsSignUp(false); }}
        onBack={() => setWaitingEmailConfirm(false)}
      />
    );
  }

  // On tablet: card with fixed max-width centered. On mobile: full-width flat form.
  const showCard = isTablet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            { paddingHorizontal: hPad },
            // less vertical padding on small phones
            isSmall && { paddingVertical: spacing.l },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Brand ── */}
          <Animated.View
            style={[
              styles.brand,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              // compact on small phones
              isSmall && { marginBottom: spacing.l },
            ]}
          >
            <View style={[styles.logoCircle, isSmall && styles.logoCircleSmall]}>
              <Text style={[styles.logoEmoji, isSmall && { fontSize: 36 }]}>🦄</Text>
            </View>
            <Text style={[styles.appName, isSmall && { fontSize: 22 }]}>
              Conexão Terapêutica
            </Text>
            <Text style={styles.orgName}>Unicórnio Campina Verde</Text>
            {/* Hide tagline on very small phones to save space */}
            {!isSmall && (
              <Text style={styles.tagline}>A rotina do seu filho, organizada e conectada.</Text>
            )}
          </Animated.View>

          {/* ── Form Area ── */}
          <Animated.View
            style={[
              styles.formArea,
              showCard && styles.card,
              showCard && { padding: cardPad },
              { opacity: formFade },
            ]}
          >
            {/* Form header */}
            <View style={styles.formHeader}>
              <View style={[
                styles.formHeaderIcon,
                { backgroundColor: isSignUp ? `${colors.secondary}15` : `${colors.primary}15` },
              ]}>
                {isSignUp
                  ? <UserPlus size={20} color={colors.secondary} />
                  : <LogIn size={20} color={colors.primary} />
                }
              </View>
              <Text style={styles.formTitle}>
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Text>
            </View>

            {/* Fields */}
            <View style={styles.fields}>
              {isSignUp && (
                <Input
                  label="Nome Completo"
                  onChangeText={t => { setFullName(t); setErrorMsg(''); }}
                  value={fullName}
                  placeholder="Ex: Maria Silva"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              )}
              <Input
                label="E-mail"
                onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                value={email}
                placeholder="email@exemplo.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <Input
                label="Senha"
                onChangeText={t => { setPassword(t); setErrorMsg(''); }}
                value={password}
                secureTextEntry={!showPassword}
                placeholder="Mínimo 6 caracteres"
                autoCapitalize="none"
                textContentType={isSignUp ? 'newPassword' : 'password'}
                returnKeyType="done"
                onSubmitEditing={() => isSignUp ? signUpWithEmail() : signInWithEmail()}
                hint={isSignUp ? 'Use pelo menos 6 caracteres' : undefined}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword
                      ? <EyeOff color={colors.textSecondary} size={18} />
                      : <Eye color={colors.textSecondary} size={18} />
                    }
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Error */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTxt}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {/* Forgot */}
            {!isSignUp && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotTxt}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA */}
            <Button
              title={isSignUp ? 'Criar Conta' : 'Entrar'}
              onPress={() => isSignUp ? signUpWithEmail() : signInWithEmail()}
              loading={loading}
              style={styles.primaryBtn}
            />

            {/* Switch */}
            <TouchableOpacity onPress={handleSwitch} style={styles.switchBtn}>
              <Text style={styles.switchTxt}>
                {isSignUp ? 'Já tenho uma conta' : 'Criar nova conta'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tour */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Tutorial')}
            style={styles.tourBtn}
          >
            <Sparkles color={colors.textSecondary} size={13} />
            <Text style={styles.tourTxt}>Conhecer o app antes de entrar</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex:     { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
  },

  // ── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}18`,
    borderWidth: 2,
    borderColor: `${colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  logoCircleSmall: { width: 64, height: 64, borderRadius: 32 },
  logoEmoji: { fontSize: 40 },
  appName: {
    ...(typography.h1 as object),
    fontSize: 26,
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
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Form ───────────────────────────────────────────────────────────────────
  formArea: {},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.l,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  formHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    ...(typography.h2 as object),
    fontSize: 20,
    color: colors.text,
  },

  fields: { marginBottom: spacing.s },
  eyeBtn: { paddingHorizontal: spacing.s, paddingVertical: spacing.s },

  errorBox: {
    backgroundColor: '#fff1f2',
    borderRadius: radii.s,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorTxt: { color: colors.error, fontSize: 14, fontWeight: '500' as const },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.l },
  forgotTxt: {
    ...(typography.body2 as object),
    color: colors.primaryDark,
    fontWeight: '600' as const,
  },

  primaryBtn: { width: '100%', marginBottom: spacing.m },

  switchBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.m,
    paddingVertical: spacing.m,
    alignItems: 'center',
  },
  switchTxt: {
    ...(typography.body2 as object),
    color: colors.text,
    fontWeight: '600' as const,
  },

  // ── Tour ───────────────────────────────────────────────────────────────────
  tourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginTop: spacing.xl,
    paddingVertical: spacing.s,
  },
  tourTxt: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
  },
});
