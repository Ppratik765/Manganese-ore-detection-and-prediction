'use client';

import React, { useState } from 'react';
import { PrescriptiveAction, PrescriptiveOptimizationPlan, SimulationResponse } from '@/lib/api';
import { 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  Droplets, 
  Wrench, 
  Truck,
  Flame,
  Activity,
  Zap,
  Check
} from 'lucide-react';

interface PrescriptiveAlertsProps {
  simulationResult?: SimulationResponse | null;
  defaultPlan?: PrescriptiveOptimizationPlan | null;
}

export const PrescriptiveAlerts: React.FC<PrescriptiveAlertsProps> = ({
  simulationResult,
  defaultPlan,
}) => {
  const plan = simulationResult?.prescriptive_optimization || defaultPlan || {
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
        status: 'RECOMMENDED'
      }
    ]
  };

  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});

  const handleDispatch = (actionId: string) => {
    setDispatchedMap(prev => ({ ...prev, [actionId]: true }));
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Drainage') || category.includes('Weather')) return <Droplets className="w-4 h-4 text-brand-cyan" />;
    if (category.includes('Blasting') || category.includes('Fragmentation')) return <Flame className="w-4 h-4 text-brand-gold" />;
    if (category.includes('Maintenance')) return <Wrench className="w-4 h-4 text-brand-sand" />;
    return <Truck className="w-4 h-4 text-brand-teal" />;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-300 border-red-700/60 shadow-[0_0_12px_rgba(239,68,68,0.3)]';
      case 'HIGH':
        return 'bg-surface-hover text-brand-gold border-brand-gold/60 shadow-[0_0_10px_rgba(255,215,88,0.2)]';
      case 'RECOMMENDED':
      case 'OPTIMAL':
        return 'bg-surface-hover text-brand-cyan border-brand-cyan/60';
      default:
        return 'bg-surface-hover text-brand-sand border-brand-sand/50';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full border border-border-subtle shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-cyan p-[1px] shadow-lg shadow-brand-cyan/20">
            <div className="w-full h-full bg-canvas-dark rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand-cyan" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Prescriptive Dispatch & Mitigation Feed</h3>
              <span className="text-[10px] font-mono text-brand-cyan bg-canvas-dark border border-brand-cyan/40 px-1.5 py-0.5 rounded font-semibold">
                Neural Optimizer
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Automated heuristics and dynamic equipment rerouting workflows
            </p>
          </div>
        </div>

        {/* Recovery Summary */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-surface-card border border-brand-cyan/40 text-brand-cyan font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(43,187,215,0.15)]">
            <TrendingUp className="w-3.5 h-3.5 text-brand-sand" />
            <span>+{plan.estimated_recovery_tonnes} Tonnes Recoverable</span>
          </div>
        </div>
      </div>

      {/* Plan Performance Metric Banner */}
      <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-canvas-dark/60 border border-border-subtle text-[11px] font-mono">
        <div>
          <span className="text-[10px] text-text-secondary block uppercase">Baseline Output:</span>
          <span className="font-bold text-text-primary">{plan.original_predicted_tonnage} T</span>
        </div>
        <div>
          <span className="text-[10px] text-text-secondary block uppercase">Post-Mitigation:</span>
          <span className="font-bold text-brand-cyan">{plan.post_mitigation_tonnage} T</span>
        </div>
        <div>
          <span className="text-[10px] text-text-secondary block uppercase">Deficit Reduction:</span>
          <span className="font-bold text-brand-sand">{plan.shortfall_reduction_pct}%</span>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-3 mt-3.5">
        {plan.prescriptive_actions.map((action) => {
          const isDispatched = dispatchedMap[action.id];

          return (
            <div
              key={action.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isDispatched
                  ? 'bg-canvas-dark/50 border-brand-cyan/40 opacity-90'
                  : 'bg-surface-card border-border-subtle hover:border-brand-cyan/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-canvas-dark border border-border-subtle">
                    {getCategoryIcon(action.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-text-primary">{action.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${getPriorityBadge(action.priority)}`}>
                        {action.priority}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      {action.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-text-secondary">
                      <span className="text-brand-cyan font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-brand-sand" />
                        Potential Recovery: +{action.potential_recovery_tonnes} T
                      </span>
                      <span>|</span>
                      <span className="flex items-center gap-1 text-text-secondary">
                        <Clock className="w-3 h-3 text-brand-gold" />
                        Window: {action.urgency_mins} mins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispatch Trigger Button */}
                <button
                  onClick={() => handleDispatch(action.id)}
                  disabled={isDispatched}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                    isDispatched
                      ? 'bg-canvas-dark text-brand-cyan border border-brand-cyan/60 cursor-default'
                      : 'bg-gradient-to-r from-brand-teal to-brand-cyan hover:brightness-110 text-canvas-dark font-bold active:scale-95'
                  }`}
                >
                  {isDispatched ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>DISPATCHED</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Execute</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
