/**
 * Firebase — Conexão Terapêutica
 * Serviços: Analytics, Performance Monitoring, App Check, Remote Config
 * Auth e banco de dados → Supabase (não duplicar)
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

const isWeb = Platform.OS === 'web';

// ─── Analytics ────────────────────────────────────────────────────────────────

export const initAnalytics = async () => {
  if (!isWeb) return null;
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (!(await isSupported())) return null;
    return getAnalytics(firebaseApp);
  } catch {
    return null;
  }
};

export const logEvent = async (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (!isWeb) return;
  try {
    const { getAnalytics, logEvent: fbLog, isSupported } = await import('firebase/analytics');
    if (!(await isSupported())) return;
    fbLog(getAnalytics(firebaseApp), eventName, params);
  } catch { /* não crítico */ }
};

export const logScreen = (screenName: string) =>
  logEvent('screen_view', { firebase_screen: screenName });

// ─── Performance Monitoring ───────────────────────────────────────────────────

export const initPerformance = async () => {
  if (!isWeb) return null;
  try {
    const { getPerformance } = await import('firebase/performance');
    return getPerformance(firebaseApp);
  } catch {
    return null;
  }
};

/** Mede o tempo de uma operação assíncrona e envia ao Firebase Performance */
export const measureTrace = async <T>(
  traceName: string,
  fn: () => Promise<T>
): Promise<T> => {
  if (!isWeb) return fn();
  try {
    const { getPerformance, trace } = await import('firebase/performance');
    const perf = getPerformance(firebaseApp);
    const t = trace(perf, traceName);
    t.start();
    try {
      const result = await fn();
      t.stop();
      return result;
    } catch (e) {
      t.stop();
      throw e;
    }
  } catch {
    return fn(); // fallback: executa direto sem trace
  }
};

// ─── App Check ────────────────────────────────────────────────────────────────
// Protege as APIs do Firebase contra abuso usando reCAPTCHA v3

export const initAppCheck = async () => {
  if (!isWeb) return;
  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');

    // Chave pública do reCAPTCHA v3 — safe to expose
    // Gerada em: https://www.google.com/recaptcha/admin
    // Domínios autorizados devem incluir: localhost + conexao-unicornio.web.app
    const RECAPTCHA_SITE_KEY = process.env['EXPO_PUBLIC_RECAPTCHA_SITE_KEY'] ?? '';

    if (!RECAPTCHA_SITE_KEY) {
      console.warn('[AppCheck] EXPO_PUBLIC_RECAPTCHA_SITE_KEY não configurado — pulando App Check');
      return;
    }

    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    /* não crítico */
  }
};

// ─── Remote Config ────────────────────────────────────────────────────────────
// Feature flags e configurações sem precisar de novo deploy

/** Valores padrão — usados enquanto o Remote Config não carrega */
const REMOTE_CONFIG_DEFAULTS = {
  emergency_mode_enabled: true,
  max_dependents: 5,
  show_ai_suggestions: false,
  maintenance_message: '',
  app_version_min: '1.0.0',
} as const;

export type RemoteConfigKeys = keyof typeof REMOTE_CONFIG_DEFAULTS;

let _remoteConfig: unknown = null;

export const initRemoteConfig = async () => {
  if (!isWeb) return null;
  try {
    const { getRemoteConfig, fetchAndActivate, setLogLevel } = await import('firebase/remote-config');
    const rc = getRemoteConfig(firebaseApp);

    // Em dev, fetch a cada 30s; em prod, a cada 12h
    rc.settings.minimumFetchIntervalMillis = __DEV__ ? 30_000 : 43_200_000;
    rc.defaultConfig = REMOTE_CONFIG_DEFAULTS as Record<string, string | number | boolean>;

    if (__DEV__) setLogLevel(rc, 'debug');

    await fetchAndActivate(rc);
    _remoteConfig = rc;
    return rc;
  } catch {
    return null;
  }
};

export const getRemoteValue = <K extends RemoteConfigKeys>(
  key: K
): typeof REMOTE_CONFIG_DEFAULTS[K] => {
  if (!_remoteConfig) return REMOTE_CONFIG_DEFAULTS[key];
  try {
    // Importação síncrona não funciona aqui — usamos o cache de _remoteConfig
    const { getValue } = require('firebase/remote-config');
    const val = getValue(_remoteConfig, key);
    const def = REMOTE_CONFIG_DEFAULTS[key];
    if (typeof def === 'boolean') return val.asBoolean() as typeof REMOTE_CONFIG_DEFAULTS[K];
    if (typeof def === 'number')  return val.asNumber()  as typeof REMOTE_CONFIG_DEFAULTS[K];
    return val.asString() as typeof REMOTE_CONFIG_DEFAULTS[K];
  } catch {
    return REMOTE_CONFIG_DEFAULTS[key];
  }
};
