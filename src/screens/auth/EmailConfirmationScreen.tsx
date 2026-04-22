import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';

export const EmailConfirmationScreen = ({ email, onConfirm, onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { justifyContent: 'center', flex: 1 }]}
      >
        <View style={styles.confirmContainer}>
          <Text style={styles.confirmEmoji}>📧</Text>
          <Text style={styles.confirmTitle}>Verifique seu email!</Text>
          <Text style={styles.confirmBody}>
            Enviamos um link de confirmação para{' '}
            <Text style={{ fontWeight: '700' as const, color: colors.primaryDark }}>
              {email}
            </Text>
            . Abra o email, clique no link e depois volte aqui para entrar.
          </Text>
          <View style={styles.confirmSteps}>
            <Text style={styles.confirmStep}>1️⃣ Abra seu aplicativo de email</Text>
            <Text style={styles.confirmStep}>2️⃣ Procure o email da Conexão Terapêutica</Text>
            <Text style={styles.confirmStep}>3️⃣ Clique em "Confirmar email"</Text>
            <Text style={styles.confirmStep}>4️⃣ Volte aqui e clique em Entrar abaixo</Text>
          </View>
          <Button title="Já confirmei — Ir para Login" onPress={onConfirm} />
          <TouchableOpacity style={styles.toggleButton} onPress={onBack}>
            <Text style={styles.toggleText}>← Voltar para o cadastro</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    padding: spacing.l,
    paddingBottom: 100,
  },
  confirmContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.l,
  },
  confirmEmoji: {
    fontSize: 64,
    marginBottom: spacing.s,
  },
  confirmTitle: {
    ...(typography.h1 as object),
    color: colors.primaryDark,
    textAlign: 'center',
  },
  confirmBody: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.m,
  },
  confirmSteps: {
    width: '100%',
    backgroundColor: `${colors.primary}08`,
    borderRadius: 16,
    padding: spacing.l,
    gap: spacing.m,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  confirmStep: {
    ...(typography.body2 as object),
    color: colors.text,
    lineHeight: 22,
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
});
