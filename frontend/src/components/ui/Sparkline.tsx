'use client';

import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/** Smooth line + soft area fill with a draw-in animation. */
export const Sparkline: React.FC<SparklineProps> = ({ data, width = 120, height = 36, color = '#dda15e', className }) => {
  const id = useId().replace(/:/g, '');
  const { motionEnabled } = useMotionPreference();

  const { line, area, last } = useMemo(() => {
    if (data.length < 2) return { line: '', area: '', last: null as null | [number, number] };
    const pad = 3;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = Math.max(1e-6, max - min);
    const pts: [number, number][] = data.map((v, i) => [
      pad + (i / (data.length - 1)) * (width - pad * 2),
      pad + (1 - (v - min) / span) * (height - pad * 2),
    ]);
    // Catmull-Rom to cubic Bezier for a smooth curve.
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
    }
    const a = `${d} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
    return { line: d, area: a, last: pts[pts.length - 1] };
  }, [data, width, height]);

  if (!line) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#spark-${id})`} initial={motionEnabled ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        initial={motionEnabled ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      />
      {last && <circle cx={last[0]} cy={last[1]} r={2.6} fill="#0b0c08" stroke={color} strokeWidth={1.6} />}
    </svg>
  );
};
