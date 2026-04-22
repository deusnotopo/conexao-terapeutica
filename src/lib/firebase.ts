/**
 * Firebase — Conexão Terapêutica
 * Usado para: Google Analytics, Crashlytics (futuro), Hosting
 * Auth e banco de dados → Supabase (não migrar)
 */
import { initializeApp, getApps } from 'firebase/app';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCM24HDNMxAH-wXXDClYF-U3_PbBdsTV9g',
  authDomain: 'conexao-terapeutica-7d3c8.firebaseapp.com',
  projectId: 'conexao-terapeutica-7d3c8',
  storageBucket: 'conexao-terapeutica-7d3c8.firebasestorage.app',
  messagingSenderId: '61196094873',
  appId: '1:61196094873:web:dd5515eec2c1e7ff2c5708',
  measurementId: 'G-FRG2V6DHY7',
};

// Evita reinicializar em hot reload
export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

/**
 * Analytics — apenas disponível na web
 * React Native nativo requer @react-native-firebase/analytics
 */
export const initAnalytics = async () => {
  if (Platform.OS !== 'web') return null;
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    if (!supported) return null;
    return getAnalytics(firebaseApp);
  } catch {
    return null;
  }
};

export const logEvent = async (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (Platform.OS !== 'web') return;
  try {
    const { getAnalytics, logEvent: fbLogEvent, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    if (!supported) return;
    fbLogEvent(getAnalytics(firebaseApp), eventName, params);
  } catch {
    // Analytics não crítico — falha silenciosa
  }
};

export const logScreen = async (screenName: string) => {
  await logEvent('screen_view', { firebase_screen: screenName });
};
