/**
 * QuantSuite Design Tokens
 * Semantic tokens for consistent theming across QuantSuite
 */

export const designTokens = {
  // Brand Colors (HSL)
  brand: {
    50: 'hsl(187 100% 97%)',
    100: 'hsl(187 95% 92%)',
    200: 'hsl(187 90% 82%)',
    300: 'hsl(187 85% 72%)',
    400: 'hsl(187 80% 62%)',
    500: 'hsl(187 100% 48%)', // Primary brand color
    600: 'hsl(187 100% 38%)',
    700: 'hsl(187 100% 28%)',
    800: 'hsl(187 100% 18%)',
    900: 'hsl(187 100% 12%)',
  },
  
  // Trading Semantics
  trading: {
    profit: 'hsl(142 71% 45%)',
    profitLight: 'hsl(142 71% 55%)',
    loss: 'hsl(0 84% 60%)',
    lossLight: 'hsl(0 84% 70%)',
    neutral: 'hsl(0 0% 64%)',
  },
  
  // Market Status Colors
  market: {
    open: 'hsl(142 71% 45%)',
    closed: 'hsl(0 0% 50%)',
    preMarket: 'hsl(45 93% 47%)',
    postMarket: 'hsl(262 83% 58%)',
  },
  
  // Motion Tokens
  motion: {
    durationFast: '150ms',
    durationNormal: '250ms',
    durationSlow: '400ms',
    durationVerySlow: '600ms',
    easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  // Glassmorphism Tokens
  glass: {
    background: 'hsla(0 0% 100% / 0.05)',
    backgroundLight: 'hsla(0 0% 100% / 0.08)',
    backgroundDark: 'hsla(0 0% 0% / 0.2)',
    border: 'hsla(0 0% 100% / 0.1)',
    borderLight: 'hsla(0 0% 100% / 0.15)',
    blur: '16px',
    blurHeavy: '24px',
    shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  
  // Spacing Scale (px)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Z-Index Scale
  zIndex: {
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
  },
  
  // Border Radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
} as const;

export type DesignTokens = typeof designTokens;
