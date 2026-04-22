import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useColorScheme } from 'react-native';

// ─── Color Token Types ────────────────────────────────────────────────────────

export type ColorTokens = {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
  border: string;
};

type ThemeContextType = {
  isDark: boolean;
  colors: ColorTokens;
  toggleTheme: () => void;
  lightColors: ColorTokens;
  darkColors: ColorTokens;
};

// ─── Light Tokens ─────────────────────────────────────────────────────────────

const lightColors: ColorTokens = {
  primary: '#10b981',
  primaryDark: '#059669',
  secondary: '#3b82f6',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  text: '#1e293b',
  textSecondary: '#64748b',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  border: '#e2e8f0',
};

// ─── Dark Tokens ──────────────────────────────────────────────────────────────

const darkColors: ColorTokens = {
  primary: '#10b981',
  primaryDark: '#34d399',
  secondary: '#60a5fa',
  background: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#273549',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  error: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
  border: '#334155',
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  lightColors,
  darkColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'dark' | 'light' | null>(null);

  const isDark = override !== null ? override === 'dark' : systemScheme === 'dark';

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      if (prev === null) return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  const value = useMemo<ThemeContextType>(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, toggleTheme, lightColors, darkColors }),
    [isDark, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);

export { lightColors, darkColors };
