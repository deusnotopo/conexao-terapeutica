import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { colors, typography, spacing, shadows } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NetworkBanner = () => {
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -100,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isOffline]);

  if (netInfo.isConnected === null) return null; // Initializing

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          paddingTop: Math.max(insets.top, spacing.m), // Safe area overlay
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <WifiOff size={16} color="#fff" />
        <Text style={styles.text}>Você está trabalhando Offline</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  text: {
    ...(typography.caption as object),
    color: '#fff',
    fontWeight: '600' as const,
  },
});
