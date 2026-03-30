import { useMemo } from 'react';
import { useQuantSuiteStore } from '@/stores/quantsuiteStore';

interface AdaptiveTheme {
  primaryColor: string;
  accentColor: string;
  ambientGlow: string;
  animationDuration: string;
  enableParticles: boolean;
  marketStatusColor: string;
}

/**
 * Get ambient glow color based on time of day
 */
function getAmbientGlow(hour: number): string {
  if (hour >= 6 && hour < 9) {
    // Morning: soft orange
    return 'hsla(30, 100%, 50%, 0.1)';
  } else if (hour >= 9 && hour < 16) {
    // Market hours: cyan
    return 'hsla(187, 100%, 48%, 0.15)';
  } else if (hour >= 16 && hour < 20) {
    // Evening: purple
    return 'hsla(262, 83%, 58%, 0.1)';
  } else {
    // Night: deep blue
    return 'hsla(220, 80%, 30%, 0.08)';
  }
}

/**
 * Adaptive theme hook that changes based on market status and time
 */
export function useAdaptiveTheme(): AdaptiveTheme {
  const { marketStatus } = useQuantSuiteStore();
  const prefersReducedMotion = usePrefersReducedMotion();

  const theme = useMemo(() => {
    const currentHour = new Date().getHours();

    // Market-aware primary color
    let primaryColor: string;
    let marketStatusColor: string;

    switch (marketStatus) {
      case 'open':
        primaryColor = 'hsl(187 100% 48%)'; // Cyan for active markets
        marketStatusColor = 'hsl(142 71% 45%)'; // Green
        break;
      case 'pre-market':
        primaryColor = 'hsl(45 93% 47%)'; // Yellow-orange
        marketStatusColor = 'hsl(45 93% 47%)';
        break;
      case 'post-market':
        primaryColor = 'hsl(262 83% 58%)'; // Purple
        marketStatusColor = 'hsl(262 83% 58%)';
        break;
      case 'closed':
      default:
        primaryColor = 'hsl(0 0% 50%)'; // Gray for closed
        marketStatusColor = 'hsl(0 0% 50%)';
        break;
    }

    return {
      primaryColor,
      accentColor: primaryColor,
      ambientGlow: getAmbientGlow(currentHour),
      animationDuration: prefersReducedMotion ? '0ms' : '250ms',
      enableParticles: !prefersReducedMotion && marketStatus === 'open',
      marketStatusColor,
    };
  }, [marketStatus, prefersReducedMotion]);

  return theme;
}

/**
 * Hook to check if user prefers reduced motion
 */
function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  }, []);
}
