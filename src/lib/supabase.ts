import { Platform } from 'react-native';

// Polyfill URL on Native only. Overriding native web URL can break fetch and Supabase auth.
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

import { createClient } from '@supabase/supabase-js';

// Supabase Cloud - Projeto: conexao-terapeutica (Unicórnio Campina Verde)
// As credenciais são carregadas via variáveis de ambiente (arquivo .env na raiz do projeto)
// Consulte o arquivo .env.example para configuração
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'FALHA CRÍTICA DE CONFIGURAÇÃO: EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY não estão definidos no ambiente. Verifique seu arquivo .env'
  );
}

// Use default window.localStorage on web (return undefined), use AsyncStorage on native
const getStorage = () => {
  if (Platform.OS === 'web') {
    return undefined; // Supabase will natively default to standard window.localStorage
  }
  // Native: lazy import AsyncStorage to avoid web bundle issues
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
