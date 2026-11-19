import { useEffect, useRef } from 'react';
import { animate, motion, useInView } from 'framer-motion';

/** Shared animation presets so every section moves the same way. */
export const easeOut = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const stagger = (staggerChildren = 0.07, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** A section that fades up into view (once) when scrolled to. */
export function Reveal({ as = 'section', className, children, delay = 0 }) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      // "some": start as soon as any part is visible, so tall sections (the table) never sit blank.
      viewport={{ once: true, amount: 'some' }}
      variants={{ hidden: fadeUp.hidden, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay } } }}
    >
      {children}
    </Component>
  );
}

/** Counts from 0 up to `value` when it first becomes visible. Keeps any suffix such as "%". */
export function CountUp({ value, decimals = 0, suffix = '', duration = 1.1 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return undefined;
    const controls = animate(0, value, {
      duration,
      ease: easeOut,
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = `${latest.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals, suffix, duration]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}
