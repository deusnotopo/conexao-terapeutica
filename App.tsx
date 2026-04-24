import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
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

const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1a1a2e' }}>
    <Text style={{ color: '#e94560', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
      ⚠️ Algo deu errado!
    </Text>
    <ScrollView style={{ maxHeight: 200, width: '100%', marginBottom: 20 }}>
      <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'monospace' }}>
        {error?.message || error?.toString()}
      </Text>
    </ScrollView>
    <View style={{ backgroundColor: '#e94560', borderRadius: 8, overflow: 'hidden' }}>
      <Text style={{ color: 'white', padding: 12, fontWeight: 'bold', textAlign: 'center' }} onPress={resetErrorBoundary}>
        Tentar Novamente
      </Text>
    </View>
  </View>
);
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
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => { /* reset app state if needed */ }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <SyncProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <Toast />
          <NetworkBanner />
        </SyncProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
