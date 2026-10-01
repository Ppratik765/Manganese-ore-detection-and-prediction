'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cursor-following warm spotlight and gradient hairline on hover. */
  spotlight?: boolean;
  /** Entrance delay in seconds (for staggered reveals). */
  delay?: number;
}

export const Panel: React.FC<PanelProps> = ({ spotlight = true, delay = 0, className = '', children, onPointerMove, ...rest }) => {
  const { motionEnabled } = useMotionPreference();

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      onPointerMove?.(e);
    },
    [onPointerMove],
  );

  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 18 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={spotlight ? handleMove : onPointerMove}
      className={`panel ${spotlight ? 'panel-spot' : ''} ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  );
};

interface PanelHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ eyebrow, title, subtitle, icon, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
    <div className="flex items-start gap-3 min-w-0">
      {icon && (
        <div className="mt-0.5 w-9 h-9 shrink-0 rounded-xl bg-gradient-to-b from-brand-caramel/20 to-brand-caramel/5 border border-brand-caramel/25 flex items-center justify-center text-brand-caramel">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h3 className="font-display text-[19px] leading-tight text-text-primary" style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 40" }}>
          {title}
        </h3>
        {subtitle && <p className="text-[12px] text-text-secondary mt-1 leading-relaxed max-w-prose">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);
