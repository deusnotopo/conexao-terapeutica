// src/theme/index.js

export const colors = {
  // Brand
  primary: '#10b981', // Verde suave (Equoterapia/Natureza)
  primaryDark: '#059669',
  secondary: '#3b82f6', // Azul calmante
  
  // Semantic
  error: '#ef4444',
  errorBg: '#fff1f2',
  success: '#22c55e',
  successBg: '#f0fdf4',
  warning: '#f59e0b',
  warningBg: '#fef9c3',
  info: '#06b6d4',
  infoBg: '#ecfeff',
  
  // Neutral
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',

  // UI Palette (supporting hardcoded-free UI)
  purple: '#7c3aed',
  purpleBg: '#ede9fe',
  blue: '#3b82f6',
  blueBg: '#eff6ff',
  emerald: '#059669',
  emeraldBg: '#dcfce7',
  amber: '#d97706',
  amberBg: '#fffbeb',
  cyan: '#0891b2',
  cyanBg: '#e0f2fe',
  rose: '#e11d48',
  roseBg: '#fff1f2',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

import { TextStyle } from 'react-native';

type TypographyToken = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'color' | 'lineHeight'>;

export const typography: Record<string, TypographyToken> = {
  h1: { fontSize: 32, fontWeight: '700', color: colors.text },
  h2: { fontSize: 24, fontWeight: '600', color: colors.text },
  h3: { fontSize: 20, fontWeight: '600', color: colors.text },
  body1: { fontSize: 16, color: colors.text, lineHeight: 24 },
  body2: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.textSecondary },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const radii = {
  s: 8,
  m: 12,
  card: 16,
  l: 20,
  chip: 20,
  full: 999,
};
