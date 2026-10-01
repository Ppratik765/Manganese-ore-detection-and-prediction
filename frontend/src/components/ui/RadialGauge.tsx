'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface RadialGaugeProps {
  /** 0 to 100 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  colorTo?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Ring gauge with a gradient arc that sweeps to its value. */
export const RadialGauge: React.FC<RadialGaugeProps> = ({ value, size = 64, stroke = 6, color = '#dda15e', colorTo, children, className = '' }) => {
  const id = useId().replace(/:/g, '');
  const { motionEnabled } = useMotionPreference();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`gauge-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={colorTo || color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(254,250,224,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#gauge-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={motionEnabled ? { strokeDashoffset: c } : false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};
