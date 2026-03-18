import { Platform } from 'react-native';

// Polyfill URL on Native only. Overriding native web URL can break fetch and Supabase auth.
if (Platform.OS !== 'web') {
    require('react-native-url-polyfill/auto');
}

import { createClient } from '@supabase/supabase-js';

// Supabase Cloud - Projeto: conexao-terapeutica (Unicórnio Campina Verde)
const supabaseUrl = 'https://qermptxmpqzakvtcgosu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcm1wdHhtcHF6YWt2dGNnb3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTU3NDMsImV4cCI6MjA4OTMzMTc0M30.OG8kNaHPuO0c2hGXkpHb6XZEyAl2BooJ6GOg6jPMksQ';

// Use default window.localStorage on web (return undefined), use AsyncStorage on native
const getStorage = () => {
    if (Platform.OS === 'web') {
        return undefined; // Supabase will natively default to standard window.localStorage
    }
    // Native: lazy import AsyncStorage to avoid web bundle issues
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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

