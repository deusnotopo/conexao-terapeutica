// src/theme/index.js

export const colors = {
    primary: '#10b981', // Verde suave (Equoterapia/Natureza)
    primaryDark: '#059669',
    secondary: '#3b82f6', // Azul calmante
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    border: '#e2e8f0',
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
};

export const typography = {
    h1: { fontSize: 32, fontWeight: '700', color: colors.text },
    h2: { fontSize: 24, fontWeight: '600', color: colors.text },
    h3: { fontSize: 20, fontWeight: '600', color: colors.text },
    body1: { fontSize: 16, color: colors.text },
    body2: { fontSize: 14, color: colors.textSecondary },
    caption: { fontSize: 12, color: colors.textSecondary },
};
