import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SyncProvider } from './src/context/SyncContext';
import { Toast } from './src/components/Toast';
import { notificationService } from './src/services/notificationService';
import { initAnalytics, initPerformance, initAppCheck, initRemoteConfig } from './src/lib/firebase';

// ── Error Boundary ──────────────────────────────────────────────────────────────
type ErrorBoundaryProps = {
  children: React.ReactNode;
};
type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('App Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#e94560', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
            ⚠️ Erro no Aplicativo
          </Text>
          <ScrollView style={{ maxHeight: 400, width: '100%' }}>
            <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'monospace' }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ color: '#cccccc', fontSize: 12, marginTop: 10, fontFamily: 'monospace' }}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <SafeAreaProvider style={{ flex: 1 }}>
        <SyncProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <Toast />
        </SyncProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
