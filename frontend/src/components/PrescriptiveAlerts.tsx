'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PrescriptiveAction, PrescriptiveOptimizationPlan, SimulationResponse } from '@/lib/api';
import { Send, CheckCircle2, TrendingUp, Droplets, Wrench, Truck, Flame, Zap, Loader2, Layers } from 'lucide-react';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { RadialGauge } from '@/components/ui/RadialGauge';

interface PrescriptiveAlertsProps {
  simulationResult?: SimulationResponse | null;
  defaultPlan?: PrescriptiveOptimizationPlan | null;
}

const FALLBACK_PLAN: PrescriptiveOptimizationPlan = {
  sector: 'balaghat',
  shortfall_probability: 0.12,
  risk_level: 'LOW',
  original_predicted_tonnage: 2680,
  target_tonnage: 2800,
  estimated_recovery_tonnes: 224,
  post_mitigation_tonnage: 2800,
  shortfall_reduction_pct: 95.0,
  action_count: 2,
  prescriptive_actions: [
    {
      id: 'ACTION_BLEND_05',
      category: 'Mineral Grade Blending',
      priority: 'MEDIUM',
      title: 'High-Grade Face Feed Optimization',
      description: 'Blend 65% ROM feed from High-Grade Braunite Lens #2 with 35% medium-grade stockpile to ensure plant throughput parity.',
      potential_recovery_tonnes: 224.0,
      urgency_mins: 30,
      status: 'RECOMMENDED',
    },
  ],
};

const PRIORITY = {
  CRITICAL: { color: '#e5634d', chip: 'text-danger border-danger/40 bg-danger/10' },
  HIGH: { color: '#e2703a', chip: 'text-brand-ember border-brand-ember/40 bg-brand-ember/10' },
  MEDIUM: { color: '#dda15e', chip: 'text-brand-caramel border-brand-caramel/35 bg-brand-caramel/10' },
} as const;

const categoryIcon = (category: string) => {
  const cls = 'w-4 h-4';
  if (category.includes('Drainage') || category.includes('Weather')) return <Droplets className={cls} />;
  if (category.includes('Blasting') || category.includes('Fragmentation')) return <Flame className={cls} />;
  if (category.includes('Maintenance')) return <Wrench className={cls} />;
  if (category.includes('Blending')) return <Layers className={cls} />;
  return <Truck className={cls} />;
};

type DispatchState = 'idle' | 'running' | 'done';

const ActionNode: React.FC<{
  action: PrescriptiveAction;
  index: number;
  last: boolean;
  state: DispatchState;
  onExecute: () => void;
}> = ({ action, index, last, state, onExecute }) => {
  const total = Math.max(1, action.urgency_mins * 60);
  const [left, setLeft] = useState<number>(total);
  const prio = PRIORITY[action.priority as keyof typeof PRIORITY] ?? PRIORITY.MEDIUM;

  // Live countdown of the intervention window; freezes once the action is dispatched.
  useEffect(() => {
    if (state === 'done') return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [state]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const done = state === 'done';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 14 }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="relative pl-11"
    >
      {/* Timeline rail + node */}
      {!last && <span className="absolute left-[15px] top-9 bottom-[-14px] w-px bg-gradient-to-b from-white/20 to-white/[0.04]" aria-hidden />}
      <span
        className="absolute left-0 top-1.5 w-[31px] h-[31px] rounded-full flex items-center justify-center border bg-ink-900 transition-colors duration-500"
        style={{ color: done ? '#8a9a52' : prio.color, borderColor: done ? 'rgba(138,154,82,0.5)' : `${prio.color}66` }}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : categoryIcon(action.category)}
      </span>

      <div className={`rounded-2xl border p-4 transition-all duration-500 ${done ? 'border-brand-moss/30 bg-brand-moss/[0.04]' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14]'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-medium text-text-primary">{action.title}</span>
              <span className={`font-mono text-[9.5px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${prio.chip}`}>{action.priority}</span>
            </div>
            <div className="eyebrow mt-1.5">{action.category}</div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            <div className="text-right">
              <div className="font-mono text-[13px] tabular-nums text-text-primary">{mm}:{ss}</div>
              <div className="font-mono text-[9px] tracking-widest text-text-muted uppercase">window</div>
            </div>
            <RadialGauge value={(left / total) * 100} size={34} stroke={3.5} color={done ? '#8a9a52' : prio.color} />
          </div>
        </div>

        <p className="text-[12.5px] text-text-secondary leading-relaxed mt-3">{action.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[12px] text-brand-caramel">
            <TrendingUp className="w-3.5 h-3.5" />+{action.potential_recovery_tonnes} t recoverable
          </span>

          <button
            onClick={onExecute}
            disabled={state !== 'idle'}
            className={`relative h-9 min-w-[118px] px-4 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              state === 'done' ? 'bg-brand-moss/15 text-brand-moss border border-brand-moss/40 cursor-default' : state === 'running' ? 'bg-white/[0.06] text-text-primary border border-white/10 cursor-wait' : 'btn-primary'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={state} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="flex items-center gap-2">
                {state === 'idle' && (<><Send className="w-3.5 h-3.5" />Execute</>)}
                {state === 'running' && (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Dispatching</>)}
                {state === 'done' && (<><CheckCircle2 className="w-3.5 h-3.5" />Dispatched</>)}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.li>
  );
};

export const PrescriptiveAlerts: React.FC<PrescriptiveAlertsProps> = ({ simulationResult, defaultPlan }) => {
  const plan = simulationResult?.prescriptive_optimization || defaultPlan || FALLBACK_PLAN;
  const planKey = simulationResult?.simulation_id ?? 'baseline';

  const [dispatch, setDispatch] = useState<Record<string, DispatchState>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleDispatch = (actionId: string) => {
    setDispatch((p) => ({ ...p, [actionId]: 'running' }));
    timers.current.push(setTimeout(() => setDispatch((p) => ({ ...p, [actionId]: 'done' })), 1100));
  };

  return (
    <Panel delay={0.34} spotlight={false} className="p-5 flex flex-col w-full">
      <PanelHeader
        eyebrow="Neural optimizer"
        title="Prescriptive Dispatch"
        subtitle="Automated heuristics and dynamic equipment rerouting workflows"
        icon={<Zap className="w-4 h-4" />}
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-brand-caramel border border-brand-caramel/30 bg-brand-caramel/[0.08] rounded-lg px-2.5 py-1.5">
            <TrendingUp className="w-3.5 h-3.5" />+{plan.estimated_recovery_tonnes} t recoverable
          </span>
        }
      />

      {/* Plan outcome strip */}
      <div className="grid grid-cols-3 mt-4 panel-inset divide-x divide-white/[0.07]">
        {[
          { label: 'Baseline output', value: plan.original_predicted_tonnage, suffix: ' t', tone: 'text-text-primary', dec: 0 },
          { label: 'Post-mitigation', value: plan.post_mitigation_tonnage, suffix: ' t', tone: 'text-brand-caramel', dec: 0 },
          { label: 'Deficit reduction', value: plan.shortfall_reduction_pct, suffix: '%', tone: 'text-brand-moss', dec: 1 },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3">
            <div className="eyebrow">{s.label}</div>
            <div className={`numeral text-[24px] leading-tight mt-1 ${s.tone}`}>
              <AnimatedNumber value={s.value} decimals={s.dec} suffix={s.suffix} duration={1} />
            </div>
          </div>
        ))}
      </div>

      <ol className="mt-5 space-y-3.5">
        <AnimatePresence initial={false}>
          {plan.prescriptive_actions.map((action, i) => (
            <ActionNode
              key={`${planKey}-${action.id}`}
              action={action}
              index={i}
              last={i === plan.prescriptive_actions.length - 1}
              state={dispatch[`${planKey}-${action.id}`] ?? 'idle'}
              onExecute={() => handleDispatch(`${planKey}-${action.id}`)}
            />
          ))}
        </AnimatePresence>
      </ol>
    </Panel>
  );
};
