import React from 'react';
import { ENV } from './src/lib/env'; // Validate env on app boot
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SyncProvider } from './src/context/SyncContext';
import { Toast } from './src/components/Toast';
import { NetworkBanner } from './src/components/NetworkBanner';
import { notificationService } from './src/services/notificationService';
import { initAnalytics, initPerformance, initAppCheck, initRemoteConfig } from './src/lib/firebase';
import { GlobalErrorBoundary } from './src/components/ui/GlobalErrorBoundary';

// ── App Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  React.useEffect(() => {
    notificationService.requestPermissions();
    // Firebase — todos em paralelo, falha silenciosa
    Promise.all([
      initAnalytics(),
      initPerformance(),
      initAppCheck(),
      initRemoteConfig(),
    ]);
  }, []);

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider style={{ flex: 1 }}>
        <SyncProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <Toast />
          <NetworkBanner />
        </SyncProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}
