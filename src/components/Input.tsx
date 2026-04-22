import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
};

export const Input: React.FC<InputProps> = ({ label, error, icon, rightIcon, style, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error && styles.inputRowError,
        ]}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            rightIcon ? { paddingRight: 40 } : {},
          ] as any}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          {...props}
        />
        {rightIcon ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.m },
  label: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.s,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  inputRowFocused: { borderColor: colors.primary, backgroundColor: `${colors.primary}05` },
  inputRowError: { borderColor: colors.error },
  iconWrap: { paddingLeft: spacing.m, paddingRight: spacing.s },
  input: {
    flex: 1,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    ...(typography.body1 as object),
    color: colors.text,
  },
  inputWithIcon: { paddingLeft: 0 },
  rightIconWrap: { position: 'absolute', right: spacing.m },
  error: {
    ...(typography.caption as object),
    color: colors.error,
    marginTop: spacing.xs,
  },
});
