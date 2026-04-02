import { Suspense } from 'react';
import { useRenderWhenNearViewport } from '../hooks/usePerformanceProfile';

function DeferredSection({
  as: Component = 'section',
  children,
  fallback = null,
  minHeight,
  rootMargin,
  threshold,
  className,
  style,
  ...rest
}) {
  const [sectionRef, shouldRender, isInViewport] = useRenderWhenNearViewport({
    rootMargin,
    threshold,
  });

  return (
    <Component
      ref={sectionRef}
      className={className}
      style={{ minHeight, ...style }}
      data-visible={isInViewport}
      {...rest}
    >
      {shouldRender ? <Suspense fallback={fallback}>{children(isInViewport)}</Suspense> : fallback}
    </Component>
  );
}

export default DeferredSection;
