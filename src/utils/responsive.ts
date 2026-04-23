/**
 * Responsive utilities — Conexão Terapêutica
 * Mobile-first breakpoints based on real device widths.
 */
import { useWindowDimensions, PixelRatio } from 'react-native';

// Device width thresholds
export const BREAKPOINTS = {
  xs: 360,   // small Android (Galaxy A13 etc)
  sm: 390,   // iPhone SE 3rd gen, Pixel 6a
  md: 430,   // iPhone 15 Pro Max, Samsung S23+
  lg: 768,   // tablets
  xl: 1024,  // large tablets / web
} as const;

/** Returns the current window dimensions + responsive helpers */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isXSmall  = width < BREAKPOINTS.xs;
  const isSmall   = width < BREAKPOINTS.sm;
  const isMedium  = width < BREAKPOINTS.md;
  const isTablet  = width >= BREAKPOINTS.lg;
  const isWeb     = width >= BREAKPOINTS.xl;
  const isMobile  = width < BREAKPOINTS.lg;

  /**
   * Pick a value based on current screen width.
   * Usage: rs({ xs: 12, sm: 16, md: 20 }) → returns correct value
   */
  function rs<T>(values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; default: T }): T {
    if (isXSmall && values.xs !== undefined) return values.xs;
    if (isSmall  && values.sm !== undefined) return values.sm;
    if (isMedium && values.md !== undefined) return values.md;
    if (isTablet && values.lg !== undefined) return values.lg;
    if (isWeb    && values.xl !== undefined) return values.xl;
    return values.default;
  }

  /** Horizontal padding that scales safely with phone size */
  const hPad = rs({ xs: 16, sm: 20, default: 24 });

  /** Card inner padding */
  const cardPad = rs({ xs: 20, sm: 24, default: 28 });

  /** Icon/illustration size for tutorial slides */
  const slideIconSize = rs({ xs: 96, sm: 108, default: 120 });

  return {
    width,
    height,
    isXSmall,
    isSmall,
    isMedium,
    isTablet,
    isWeb,
    isMobile,
    rs,
    hPad,
    cardPad,
    slideIconSize,
  };
}
