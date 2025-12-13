import { colors } from '@/app/styles/colors';

/**
 * Hook for å bruke fargeprofilen i komponenter
 *
 * @returns Fargeobjektet
 *
 * @example
 * const colors = useColors();
 * <div style={{ backgroundColor: colors.card.light.bg }}>Innhold</div>
 */
export function useColors() {
  return colors;
}

/**
 * Helper for å få CSS-variabel-strenger for inline styles
 *
 * @example
 * const cssVars = getCSSVariables();
 * <div style={{ backgroundColor: cssVars.card.bg }}>Innhold</div>
 */
export const getCSSVariables = () => ({
  // Bakgrunnsfarger
  background: {
    primary: 'var(--background)',
    secondary: 'var(--background-secondary)',
  },
  foreground: 'var(--foreground)',

  // Primærfarger
  primary: {
    default: 'var(--primary)',
    hover: 'var(--primary-hover)',
    light: 'var(--primary-light)',
    dark: 'var(--primary-dark)',
  },

  // Sekundærfarger
  success: {
    default: 'var(--success)',
    hover: 'var(--success-hover)',
  },

  // Tekstfarger
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
  },

  // Kantfarger
  border: {
    default: 'var(--border)',
    subtle: 'var(--border-subtle)',
  },

  // Kortkomponenter
  card: {
    bg: 'var(--card-bg)',
    border: 'var(--card-border)',
  },

  // Info-bokser
  info: {
    bg: 'var(--info-bg)',
    text: 'var(--info-text)',
    accent: 'var(--info-accent)',
  },

  // Input-komponenter
  input: {
    bg: 'var(--input-bg)',
    border: 'var(--input-border)',
  },

  // Disabled states
  disabled: {
    bg: 'var(--disabled-bg)',
    text: 'var(--disabled-text)',
  },

  // Gradient
  gradient: {
    from: 'var(--gradient-from)',
    to: 'var(--gradient-to)',
  },
});

/**
 * Hook for å få CSS-variabel-strenger
 */
export function useCSSVariables() {
  return getCSSVariables();
}
