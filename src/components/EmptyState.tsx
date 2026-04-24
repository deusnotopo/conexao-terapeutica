import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'card';
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  variant = 'default',
}) => (
  <View style={[styles.container, variant === 'card' && styles.cardVariant]}>
    {icon ?? null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onAction ? (
      <TouchableOpacity style={styles.btn} onPress={onAction}>
        <Text style={styles.btnText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: spacing.m,
    paddingHorizontal: spacing.xl,
  },
  title: { ...(typography.h3 as object), color: colors.textSecondary, textAlign: 'center' },
  subtitle: { ...(typography.body2 as object), color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  cardVariant: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    margin: spacing.l,
    paddingVertical: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: `${colors.primary}10`,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginTop: spacing.s,
  },
  btnText: { ...(typography.body2 as object), fontWeight: '700' as const, color: colors.surface },
});
