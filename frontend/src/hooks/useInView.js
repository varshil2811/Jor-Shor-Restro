import { useEffect, useRef, useState } from 'react';

/**
 * Returns [ref, isVisible].
 * Re-observes automatically when the DOM node attached to ref changes.
 */
export function useInView(threshold = 0.15, once = true) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already visible and once=true — skip
    if (visible && once) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }); // no dep array — re-runs every render so it catches late-mounted elements

  return [ref, visible];
}
