import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme';

type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, actionIcon, onAction }) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Voltar para a tela anterior"
    >
      <ChevronLeft color={colors.primaryDark} size={28} />
    </TouchableOpacity>

    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    {actionIcon && onAction ? (
      <TouchableOpacity onPress={onAction} style={styles.actionBtn}>
        {actionIcon}
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
  </View>
);

const styles = StyleSheet.create({
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
  backBtn: { padding: 4 },
  title: { ...(typography.h3 as object), color: colors.primaryDark, flex: 1, textAlign: 'center' },
  actionBtn: { padding: 8, backgroundColor: `${colors.primary}15`, borderRadius: 10 },
});
