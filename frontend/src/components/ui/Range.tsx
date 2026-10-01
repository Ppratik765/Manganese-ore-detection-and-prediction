'use client';

import React from 'react';

interface RangeProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
  color?: string;
  note?: string;
  noteTone?: 'warn' | 'normal';
  onChange: (v: number) => void;
}

/** Labelled slider with a filled track and live value readout. */
export const Range: React.FC<RangeProps> = ({ label, icon, value, min, max, step, unit = '', decimals = 0, color = '#dda15e', note, noteTone = 'normal', onChange }) => {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="group py-3.5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <label className="flex items-center gap-2 text-[13px] text-text-primary">
          {icon && <span style={{ color }}>{icon}</span>}
          {label}
        </label>
        <span className="font-mono text-[13px] tabular-nums" style={{ color }}>
          {value.toFixed(decimals)}
          <span className="text-text-muted ml-1 text-[11px]">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="moil-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as any]: `${fill}%`, ['--range-color' as any]: color }}
      />
      <div className="flex justify-between font-mono text-[10px] text-text-muted -mt-0.5">
        <span>{min}</span>
        {note && <span className={noteTone === 'warn' ? 'text-brand-ember' : 'text-text-secondary'}>{note}</span>}
        <span>{max}</span>
      </div>
    </div>
  );
};
