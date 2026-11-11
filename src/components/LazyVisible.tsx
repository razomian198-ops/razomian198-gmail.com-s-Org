import React, { useEffect, useRef, useState } from 'react';

/**
 * Renders its children only once the placeholder is close to the viewport.
 * Keeps below-the-fold home sections (and their API calls) out of the first load.
 */
export const LazyVisible: React.FC<{
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
}> = ({ children, minHeight = 240, rootMargin = '500px 0px' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  if (visible) return <>{children}</>;
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
};
