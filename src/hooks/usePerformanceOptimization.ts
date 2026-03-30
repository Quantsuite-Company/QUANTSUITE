import { useEffect, useCallback } from 'react';

/**
 * Performance optimization hook to prevent WebGL context loss and improve rendering
 */
export const usePerformanceOptimization = () => {
  // Cleanup WebGL contexts to prevent memory leaks
  const cleanupWebGLContexts = useCallback(() => {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach((canvas) => {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (gl && typeof gl.getExtension === 'function') {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
    });
  }, []);

  // Debounced resize handler to prevent excessive re-renders
  const optimizedResizeHandler = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Trigger cleanup on resize
        cleanupWebGLContexts();
      }, 300);
    };
  }, [cleanupWebGLContexts]);

  // Memory management and cleanup
  useEffect(() => {
    const resizeHandler = optimizedResizeHandler();
    
    // Add performance optimizations
    window.addEventListener('resize', resizeHandler);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeHandler);
      cleanupWebGLContexts();
    };
  }, [optimizedResizeHandler, cleanupWebGLContexts]);

  // Request idle callback for heavy computations
  const requestIdleComputation = useCallback((callback: () => void) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback);
    } else {
      setTimeout(callback, 1);
    }
  }, []);

  return {
    requestIdleComputation,
    cleanupWebGLContexts
  };
};