'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OperationsTelemetryResponse, LiveMachineTelemetry } from '@/lib/api';
import { Truck, AlertTriangle, Wrench } from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { Skeleton } from '@/components/ui/Skeleton';

interface FleetStatusProps {
  operationsData?: OperationsTelemetryResponse | null;
  isLoading?: boolean;
}

type Filter = 'ALL' | LiveMachineTelemetry['status'];

const STATUS_META: Record<LiveMachineTelemetry['status'], { label: string; dot: string; text: string; border: string }> = {
  OPERATIONAL: { label: 'Operational', dot: 'bg-brand-moss', text: 'text-brand-moss', border: 'border-brand-moss/30' },
  WARNING: { label: 'Warning', dot: 'bg-brand-caramel', text: 'text-brand-caramel', border: 'border-brand-caramel/35' },
  CRITICAL_LOAD: { label: 'Critical load', dot: 'bg-danger', text: 'text-danger', border: 'border-danger/40' },
  STANDBY: { label: 'Standby', dot: 'bg-text-muted', text: 'text-text-secondary', border: 'border-white/10' },
};

export const FleetStatus: React.FC<FleetStatusProps> = ({ operationsData, isLoading = false }) => {
  const fleet = operationsData?.live_equipment_fleet || [];
  const [filter, setFilter] = useState<Filter>('ALL');

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: fleet.length };
    fleet.forEach((f) => (c[f.status] = (c[f.status] || 0) + 1));
    return c;
  }, [fleet]);

  const visible = filter === 'ALL' ? fleet : fleet.filter((f) => f.status === filter);
  const chips: Filter[] = ['ALL', 'OPERATIONAL', 'WARNING', 'CRITICAL_LOAD', 'STANDBY'].filter((k) => k === 'ALL' || counts[k]) as Filter[];

  return (
    <Panel delay={0.5} spotlight={false} className="p-5 flex flex-col w-full">
      <PanelHeader
        eyebrow="AI4I ingested logs"
        title="Heavy Fleet Telemetry"
        subtitle="Live mechanical strain, torque, thermal load and machine failure risk scoring"
        icon={<Truck className="w-4 h-4" />}
        right={
          <div className="font-mono text-[12px] text-text-secondary">
            <span className="text-brand-caramel text-[15px] tabular-nums">{fleet.filter((f) => f.status === 'OPERATIONAL').length}</span> / {fleet.length} active
          </div>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mt-4" role="tablist" aria-label="Filter fleet by status">
        {chips.map((k) => {
          const on = filter === k;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(k)}
              className={`relative px-3 h-7 rounded-full text-[11.5px] font-medium border transition-colors ${on ? 'text-ink-900 border-transparent' : 'text-text-secondary border-white/[0.09] hover:text-text-primary hover:border-white/20'}`}
            >
              {on && <motion.span layoutId="fleet-chip" className="absolute inset-0 rounded-full bg-brand-caramel" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">
                {k === 'ALL' ? 'All' : STATUS_META[k].label} <span className="font-mono opacity-70">{counts[k] ?? 0}</span>
              </span>
            </button>
          );
        })}
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {isLoading && !fleet.length
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[168px]" />)
          : null}
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((m) => {
            const meta = STATUS_META[m.status];
            const high = m.failure_risk_pct > 25;
            const riskColor = m.failure_risk_pct > 25 ? '#e5634d' : m.failure_risk_pct > 12 ? '#dda15e' : '#8a9a52';
            const tempPct = Math.max(0, Math.min(100, ((m.temp_c - 20) / 40) * 100));
            return (
              <motion.div
                key={m.equipment_id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`group rounded-2xl p-4 border bg-white/[0.025] hover:bg-white/[0.045] transition-colors ${high ? 'border-danger/40' : 'border-white/[0.07] hover:border-brand-caramel/30'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-mono text-[14px] font-semibold text-text-primary whitespace-nowrap shrink-0">{m.equipment_id}</span>
                      <span className="text-[11.5px] text-text-muted truncate">{m.model}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-text-secondary mt-1">
                      <Wrench className="w-3 h-3 text-text-muted" />
                      {m.type}
                    </div>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 font-mono text-[9.5px] tracking-wider uppercase px-2 py-1 rounded-md border ${meta.border} ${meta.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${m.status !== 'STANDBY' ? 'animate-pulse-slow' : ''}`} />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <RadialGauge value={m.failure_risk_pct} size={62} stroke={5} color={riskColor}>
                    <div className="text-center leading-none">
                      <div className="font-mono text-[12px] text-text-primary tabular-nums">{m.failure_risk_pct.toFixed(1)}</div>
                      <div className="font-mono text-[8px] text-text-muted mt-0.5">RISK %</div>
                    </div>
                  </RadialGauge>

                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div>
                      <div className="flex justify-between font-mono text-[10.5px]">
                        <span className="text-text-muted uppercase tracking-wider">Temp</span>
                        <span className={m.temp_c > 42 ? 'text-brand-ember' : 'text-text-primary'}>{m.temp_c}°C</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.08] mt-1 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: m.temp_c > 42 ? 'linear-gradient(90deg,#dda15e,#e2703a)' : 'linear-gradient(90deg,#606c38,#8a9a52)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${tempPct}%` }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10.5px]">
                      <div><span className="text-text-muted block uppercase tracking-wider text-[9px]">Torque</span><span className="text-text-primary">{m.torque_nm} Nm</span></div>
                      <div><span className="text-text-muted block uppercase tracking-wider text-[9px]">Speed</span><span className="text-text-primary">{m.rpm} rpm</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 font-mono text-[10.5px] text-text-muted">
                  <span className="truncate">Wear {m.tool_wear_min}m · Strain {m.strain_index.toFixed(1)} · {m.operator}</span>
                  {high && (
                    <span className="shrink-0 flex items-center gap-1 text-danger font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      INSPECT
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Panel>
  );
};
