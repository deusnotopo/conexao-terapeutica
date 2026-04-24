import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Skeleton } from './Skeleton';

type LoadingStateProps = {
  message?: string;
  variant?: 'spinner' | 'skeleton';
};

export const LoadingState = ({ message = 'Carregando...', variant = 'skeleton' }: LoadingStateProps) => {
  if (variant === 'skeleton') {
    return (
      <View style={styles.skeletonContainer}>
        <Skeleton height={120} borderRadius={16} style={{ marginBottom: spacing.m }} />
        <Skeleton height={120} borderRadius={16} style={{ marginBottom: spacing.m }} />
        <Skeleton height={120} borderRadius={16} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.m,
  },
  text: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
  },
  skeletonContainer: {
    padding: spacing.m,
  },
});
