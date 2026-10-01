'use client';

import React, { useId, useMemo } from 'react';
import { OperationsTelemetryResponse, ProductionHistoryRecord } from '@/lib/api';
import { Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

interface ProductionChartProps {
  operationsData?: OperationsTelemetryResponse | null;
  isLoading?: boolean;
}

const AXIS_TICK = { fill: '#77755f', fontSize: 11, fontFamily: 'JetBrains Mono Variable, monospace' };

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: ProductionHistoryRecord = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800/95 backdrop-blur-xl p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)] min-w-[220px]">
      <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-white/[0.08]">
        <span className="font-display text-[15px] text-text-primary">
          {data.day_name}, {data.date}
        </span>
        {data.is_current && <span className="font-mono text-[9.5px] tracking-widest text-brand-caramel border border-brand-caramel/40 rounded px-1.5 py-0.5">LIVE</span>}
      </div>
      <dl className="mt-2.5 space-y-1.5 text-[12px] font-mono">
        <div className="flex justify-between"><dt className="flex items-center gap-2 text-text-secondary"><i className="w-2 h-2 rounded-sm bg-brand-copper" />Actual mined</dt><dd className="text-text-primary tabular-nums">{data.actual_tonnage.toLocaleString('en-IN')} t</dd></div>
        <div className="flex justify-between"><dt className="flex items-center gap-2 text-text-secondary"><i className="w-2 h-px bg-brand-cornsilk/70 border-t border-dashed border-brand-cornsilk/70" />Target</dt><dd className="text-text-primary tabular-nums">{data.target_tonnage.toLocaleString('en-IN')} t</dd></div>
        <div className="flex justify-between"><dt className="flex items-center gap-2 text-text-secondary"><i className="w-2 h-2 rounded-full bg-brand-caramel" />AI predicted</dt><dd className="text-brand-caramel tabular-nums">{data.predicted_tonnage.toLocaleString('en-IN')} t</dd></div>
        {data.shortfall_tonnage > 0 && (
          <div className="flex justify-between pt-1.5 border-t border-white/[0.08] text-brand-ember"><dt>Shortfall</dt><dd className="tabular-nums">-{data.shortfall_tonnage.toLocaleString('en-IN')} t</dd></div>
        )}
        <div className="flex justify-between pt-1.5 border-t border-white/[0.08] text-[10.5px] text-text-muted"><dt>Rain / friction</dt><dd>{data.rainfall_mm} mm / {data.road_friction}</dd></div>
      </dl>
    </div>
  );
};

const Legend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-text-secondary">
    <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-[4px] bg-gradient-to-b from-brand-copper to-brand-copper/30" />Actual mined</span>
    <span className="flex items-center gap-2"><i className="w-4 border-t border-dashed border-brand-cornsilk/80" />Target baseline</span>
    <span className="flex items-center gap-2"><i className="w-4 border-t-2 border-brand-caramel" />AI predicted</span>
    <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-[4px] bg-brand-ember/20 border border-brand-ember/30" />Gap to target</span>
  </div>
);

export const ProductionChart: React.FC<ProductionChartProps> = ({ operationsData, isLoading = false }) => {
  const uid = useId().replace(/:/g, '');
  const history = operationsData?.production_history_7days || [];

  const data = useMemo(
    () => history.map((h) => ({ ...h, band: [Math.min(h.predicted_tonnage, h.target_tonnage), Math.max(h.predicted_tonnage, h.target_tonnage)] })),
    [history],
  );

  const yDomain = useMemo<[number, number]>(() => {
    if (!history.length) return [0, 3200];
    const all = history.flatMap((h) => [h.actual_tonnage, h.predicted_tonnage, h.target_tonnage]);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const pad = Math.max(120, (hi - lo) * 0.35);
    return [Math.max(0, Math.floor((lo - pad) / 100) * 100), Math.ceil((hi + pad) / 100) * 100];
  }, [history]);

  const totalTarget = history.reduce((acc, h) => acc + h.target_tonnage, 0);
  const totalActual = history.reduce((acc, h) => acc + h.actual_tonnage, 0);
  const totalShortfall = history.reduce((acc, h) => acc + h.shortfall_tonnage, 0);
  const overallEfficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 94.2;
  const live = history.find((h) => h.is_current);

  return (
    <Panel delay={0.38} spotlight={false} className="p-5 flex flex-col w-full">
      <PanelHeader
        eyebrow="Rolling 7-day trend"
        title="Production vs Target"
        subtitle="Multi-shift extraction tonnage with XGBoost shortfall variance"
        icon={<BarChart3 className="w-4 h-4" />}
        right={
          <div className="flex items-stretch gap-2">
            <div className="panel-inset px-3.5 py-2">
              <div className="eyebrow">Avg efficiency</div>
              <div className="numeral text-[22px] leading-tight text-brand-caramel">
                <AnimatedNumber value={overallEfficiency} decimals={1} suffix="%" />
              </div>
            </div>
            <div className="panel-inset px-3.5 py-2">
              <div className="eyebrow">Deficit</div>
              <div className={`numeral text-[22px] leading-tight ${totalShortfall > 0 ? 'text-brand-ember' : 'text-text-secondary'}`}>
                {totalShortfall > 0 ? '-' : ''}
                <AnimatedNumber value={totalShortfall} decimals={0} suffix=" t" />
              </div>
            </div>
          </div>
        }
      />

      <div className="mt-4"><Legend /></div>

      <div className="w-full h-[290px] lg:h-[320px] mt-3">
        {isLoading && !history.length ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 14, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id={`actual-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bc6c25" stopOpacity={0.62} />
                  <stop offset="100%" stopColor="#bc6c25" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`band-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2703a" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#e2703a" stopOpacity={0.08} />
                </linearGradient>
                <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(254,250,224,0.06)" vertical={false} />
              <XAxis dataKey="day_name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: 'rgba(254,250,224,0.1)' }} dy={6} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} domain={yDomain} allowDataOverflow />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(221,161,94,0.4)', strokeDasharray: '3 4' }} />

              {live && <ReferenceLine x={live.day_name} stroke="rgba(221,161,94,0.35)" strokeDasharray="2 4" label={{ value: 'LIVE', position: 'insideTopRight', fill: '#dda15e', fontSize: 9.5, fontFamily: 'JetBrains Mono Variable, monospace' }} />}

              {/* Shaded gap between forecast and target */}
              <Area dataKey="band" type="monotone" stroke="none" fill={`url(#band-${uid})`} animationDuration={1400} legendType="none" activeDot={false} />

              <Area
                dataKey="actual_tonnage"
                name="Actual mined (t)"
                type="monotone"
                stroke="#dda15e"
                strokeWidth={2}
                fill={`url(#actual-${uid})`}
                animationDuration={1600}
                activeDot={{ r: 5, fill: '#0b0c08', stroke: '#dda15e', strokeWidth: 2 }}
                dot={false}
              />
              <Line dataKey="target_tonnage" name="Target baseline (t)" type="monotone" stroke="#fefae0" strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="5 5" dot={false} activeDot={false} animationDuration={1600} />
              <Line
                dataKey="predicted_tonnage"
                name="AI predicted (t)"
                type="monotone"
                stroke="#f0c690"
                strokeWidth={2.4}
                dot={{ r: 3.5, fill: '#0b0c08', stroke: '#f0c690', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#0b0c08', stroke: '#fefae0', strokeWidth: 2 }}
                style={{ filter: `url(#glow-${uid})` }}
                animationDuration={1800}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
};
