'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const format = (v: number, decimals: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);

/** Counts smoothly from the previous value to the next one. */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, decimals = 0, duration = 1.4, prefix = '', suffix = '', className }) => {
  const { motionEnabled } = useMotionPreference();
  const [display, setDisplay] = useState<number>(motionEnabled ? 0 : value);
  const previous = useRef<number>(motionEnabled ? 0 : value);

  useEffect(() => {
    if (!motionEnabled) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        previous.current = value;
      },
    });
    return () => {
      previous.current = display;
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, motionEnabled, duration]);

  return (
    <span className={className}>
      {prefix}
      {format(display, decimals)}
      {suffix}
    </span>
  );
};
