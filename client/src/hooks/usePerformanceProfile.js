import { useEffect, useRef, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMediaQuery(query, initialValue = false) {
  const [matches, setMatches] = useState(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useDocumentVisibility() {
  const [isVisible, setIsVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    const update = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return isVisible;
}

export function usePerformanceProfile() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  const isNarrowViewport = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const isDocumentVisible = useDocumentVisibility();

  return {
    prefersReducedMotion,
    isCoarsePointer,
    isNarrowViewport,
    isDocumentVisible,
    isLowPowerDevice: prefersReducedMotion || isCoarsePointer || isNarrowViewport,
  };
}

export function useInViewport(options = {}) {
  const targetRef = useRef(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(entry.isIntersecting || entry.intersectionRatio > 0);
    }, options);

    const node = targetRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
      observer.disconnect();
    };
  }, [options.root, options.rootMargin, options.threshold]);

  return [targetRef, isInViewport];
}

export function useRenderWhenNearViewport(options = {}) {
  const { rootMargin = '400px 0px', threshold = 0, once = true } = options;
  const [targetRef, isInViewport] = useInViewport({ rootMargin, threshold });
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isInViewport) {
      setShouldRender(true);
    } else if (!once) {
      setShouldRender(false);
    }
  }, [isInViewport, once]);

  return [targetRef, shouldRender, isInViewport];
}

export function useAnimationBudget(isSectionVisible = true) {
  const profile = usePerformanceProfile();

  return {
    ...profile,
    shouldAnimate: isSectionVisible && profile.isDocumentVisible,
    targetFps: profile.isLowPowerDevice ? 30 : 60,
  };
}
