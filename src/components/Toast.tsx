import React, { useState, useRef, useCallback } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme';

type ToastType = 'success' | 'error' | 'info';
type ShowFn = (msg: string, type?: ToastType) => void;

// Singleton ref — allows showToast() to be called from outside React tree
let _showToast: ShowFn | null = null;

export const Toast: React.FC = () => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowFn>(
    (msg, toastType = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      setType(toastType);

      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 2800);
    },
    [opacity, translateY]
  );

  _showToast = show;

  const config: Record<ToastType, { bg: string; border: string; iconColor: string; Icon: React.ComponentType<{ color: string; size: number }> }> = {
    success: { bg: '#dcfce7', border: '#86efac', iconColor: '#16a34a', Icon: CheckCircle },
    error: { bg: '#fee2e2', border: '#fca5a5', iconColor: colors.error, Icon: XCircle },
    info: { bg: '#eff6ff', border: '#93c5fd', iconColor: colors.secondary, Icon: Info },
  };

  const { bg, border, iconColor, Icon } = config[type] ?? config.success;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bg, borderColor: border },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Icon color={iconColor} size={18} />
      <Text style={[styles.text, { color: iconColor }]}>{message}</Text>
    </Animated.View>
  );
};

export const showToast = (message: string, type: ToastType = 'success'): void => {
  if (_showToast) _showToast(message, type);
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
    maxWidth: 360,
  },
  text: { ...(typography.body2 as object), fontWeight: '700' as const },
});
