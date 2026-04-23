import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { colors, spacing, typography, radii } from '../theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  hint?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  style,
  hint,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, error ? '#fff5f5' : `${colors.primary}06`],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputRow,
          { borderColor, backgroundColor: bgColor },
          focused && styles.inputRowFocused,
        ]}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}

        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            // Web: remove browser default outline that overlaps our custom border
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
          ]}
          placeholderTextColor={colors.textSecondary + '99'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          selectionColor={colors.primary}
          {...props}
        />

        {rightIcon ? <View style={styles.rightIconWrap}>{rightIcon}</View> : null}
      </Animated.View>

      {/* Error OR hint below the field */}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          ⚠ {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.m },

  label: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  labelError: { color: colors.error },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.m,
    borderWidth: 1.5,
    minHeight: 52, // accessible touch target
    overflow: 'hidden',
  },
  inputRowFocused: {
    // Shadow on focus for premium feel
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 3,
        }
      : {}),
  },

  iconWrap: {
    paddingLeft: spacing.m,
    paddingRight: spacing.s,
    alignSelf: 'center',
  },
  rightIconWrap: {
    paddingRight: spacing.m,
    paddingLeft: spacing.s,
    alignSelf: 'center',
  },

  input: {
    flex: 1,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    ...(typography.body1 as object),
    color: colors.text,
    minHeight: 52,
  },
  inputWithIcon: { paddingLeft: spacing.xs },
  inputWithRightIcon: { paddingRight: spacing.xs },

  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '500' as const,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
