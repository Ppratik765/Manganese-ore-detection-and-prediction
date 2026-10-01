'use client';

import React from 'react';
import { ReserveGridResponse, OperationsTelemetryResponse, SimulationResponse } from '@/lib/api';
import { Zap, Satellite, Truck, ShieldAlert, Activity } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Sparkline } from '@/components/ui/Sparkline';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { Skeleton } from '@/components/ui/Skeleton';

interface MetricCardsProps {
  reserveData?: ReserveGridResponse | null;
  operationsData?: OperationsTelemetryResponse | null;
  simulationResult?: SimulationResponse | null;
  isLoading?: boolean;
}

const RISK_THEME = {
  LOW: { color: '#8a9a52', colorTo: '#b4c36d', label: 'Low risk', chip: 'text-brand-moss border-brand-moss/30 bg-brand-moss/10' },
  MODERATE: { color: '#dda15e', colorTo: '#e2703a', label: 'Moderate risk', chip: 'text-brand-caramel border-brand-caramel/30 bg-brand-caramel/10' },
  CRITICAL: { color: '#e5634d', colorTo: '#ff8a6b', label: 'Critical risk', chip: 'text-danger border-danger/40 bg-danger/10' },
} as const;

const CardLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center justify-between">
    <span className="eyebrow">{children}</span>
    <span className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-brand-caramel">{icon}</span>
  </div>
);

export const MetricCards: React.FC<MetricCardsProps> = ({ reserveData, operationsData, simulationResult, isLoading = false }) => {
  const isSimActive = !!simulationResult;

  const targetTonnage = simulationResult?.target_tonnage ?? operationsData?.current_shift.target_tonnage ?? 2800;
  const currentOutput = simulationResult?.predicted_tonnage ?? operationsData?.current_shift.current_achieved_tonnage ?? 2680;
  const outputRatio = Math.min(100, Math.round((currentOutput / Math.max(1, targetTonnage)) * 100));

  const gradePct = reserveData?.estimated_grade_pct ?? 44.5;
  const confidenceScore = reserveData?.confidence_score ?? 88.0;
  const unfcClass = reserveData?.unfc_classification ?? 'Measured (UNFC 331)';

  const fleetAvail = simulationResult?.simulation_inputs?.fleet_availability_pct ?? operationsData?.current_shift.fleet_availability_pct ?? 92.4;
  const activeDumpers = simulationResult?.simulation_inputs?.active_dumpers ?? operationsData?.current_shift.active_haul_trucks ?? 11;
  const haulCycle = simulationResult?.simulation_inputs?.haul_cycle_mins ?? operationsData?.current_shift.average_haul_cycle_mins ?? 23.5;

  const shortfallProb = simulationResult?.shortfall_probability ?? operationsData?.current_shift.shortfall_risk_score ?? 0.14;
  const riskLevel = (simulationResult?.risk_level ?? operationsData?.current_shift.risk_category ?? 'LOW') as keyof typeof RISK_THEME;
  const risk = RISK_THEME[riskLevel] ?? RISK_THEME.LOW;

  const history = operationsData?.production_history_7days ?? [];
  const sparkData = history.map((h) => h.actual_tonnage);
  const fleet = operationsData?.live_equipment_fleet ?? [];

  const statusColor = (s: string) =>
    s === 'OPERATIONAL' ? '#8a9a52' : s === 'WARNING' ? '#dda15e' : s === 'CRITICAL_LOAD' ? '#e5634d' : 'rgba(254,250,224,0.18)';

  const SEGMENTS = 24;
  const filledSegments = Math.round((outputRatio / 100) * SEGMENTS);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 w-full">
      {/* 1. Shift output */}
      <Panel delay={0.05} className="p-5 flex flex-col justify-between min-h-[212px]">
        <CardLabel icon={<Zap className="w-3.5 h-3.5" />}>Shift extraction</CardLabel>
        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-11 w-44" />
          ) : (
            <div className="flex items-baseline gap-2">
              <AnimatedNumber value={currentOutput} decimals={0} className="numeral text-[44px] leading-none text-text-primary" />
              <span className="font-mono text-[11px] text-text-muted">/ {targetTonnage.toLocaleString('en-IN')} t</span>
            </div>
          )}
          <div className="mt-4 flex gap-[3px]" aria-label={`${outputRatio}% of shift target`}>
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full transition-colors duration-700"
                style={{
                  background: i < filledSegments ? 'linear-gradient(90deg,#bc6c25,#dda15e)' : 'rgba(254,250,224,0.08)',
                  transitionDelay: `${i * 18}ms`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[13px] text-text-primary">
              <span className="font-mono tabular-nums text-brand-caramel">{outputRatio}%</span> of target
            </div>
            <div className="text-[11px] text-text-muted">7-day extraction trend</div>
          </div>
          {sparkData.length > 1 && <Sparkline data={sparkData} width={104} height={34} />}
        </div>
      </Panel>

      {/* 2. Mn grade */}
      <Panel delay={0.12} className="p-5 flex flex-col justify-between min-h-[212px]">
        <CardLabel icon={<Satellite className="w-3.5 h-3.5" />}>Spaceborne <span className="normal-case">Mn</span> grade</CardLabel>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            {isLoading ? (
              <Skeleton className="h-11 w-36" />
            ) : (
              <div className="flex items-baseline gap-1">
                <AnimatedNumber value={gradePct} decimals={1} className="numeral text-[44px] leading-none text-text-primary" />
                <span className="numeral text-2xl text-brand-caramel">%</span>
              </div>
            )}
            <div className="mt-1.5 font-mono text-[11px] text-brand-caramel">Mn purity</div>
          </div>
          <RadialGauge value={confidenceScore} size={74} stroke={6} color="#bc6c25" colorTo="#f0c690">
            <div className="text-center leading-none">
              <div className="font-mono text-[13px] text-text-primary tabular-nums">{confidenceScore.toFixed(0)}</div>
              <div className="font-mono text-[8.5px] tracking-widest text-text-muted mt-0.5">IoU</div>
            </div>
          </RadialGauge>
        </div>
        <div className="mt-4">
          <div className="text-[13px] text-text-primary truncate">{unfcClass}</div>
          <div className="text-[11px] text-text-muted">Model confidence {confidenceScore.toFixed(1)}%</div>
        </div>
      </Panel>

      {/* 3. Fleet */}
      <Panel delay={0.19} className="p-5 flex flex-col justify-between min-h-[212px]">
        <CardLabel icon={<Truck className="w-3.5 h-3.5" />}>Active fleet health</CardLabel>
        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-11 w-36" />
          ) : (
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={fleetAvail} decimals={1} className="numeral text-[44px] leading-none text-text-primary" />
              <span className="numeral text-2xl text-brand-caramel">%</span>
              <span className="ml-2 font-mono text-[11px] text-text-muted">ready</span>
            </div>
          )}
          <div className="mt-4 flex gap-[3px]" aria-label="Fleet unit status">
            {(fleet.length ? fleet : Array.from({ length: 10 }, () => null)).map((m, i) => (
              <span
                key={m ? m.equipment_id : i}
                title={m ? `${m.equipment_id}: ${m.status}` : undefined}
                className="h-6 flex-1 rounded-[5px]"
                style={{ background: m ? statusColor(m.status) : 'rgba(254,250,224,0.06)', opacity: m ? 0.9 : 1 }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[13px] text-text-primary">
              <span className="font-mono tabular-nums text-brand-caramel">{activeDumpers}</span> haul trucks
            </div>
            <div className="text-[11px] text-text-muted">{Number(haulCycle).toFixed(1)} min average cycle</div>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-brand-moss">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-moss animate-pulse-slow" />
            Dispatch synced
          </span>
        </div>
      </Panel>

      {/* 4. Risk */}
      <Panel delay={0.26} className="p-5 flex flex-col justify-between min-h-[212px]">
        <CardLabel icon={<ShieldAlert className="w-3.5 h-3.5" />}>Shortfall risk index</CardLabel>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            {isLoading ? (
              <Skeleton className="h-11 w-32" />
            ) : (
              <div className="flex items-baseline gap-1">
                <AnimatedNumber value={shortfallProb * 100} decimals={1} className="numeral text-[44px] leading-none" />
                <span className="numeral text-2xl text-text-secondary">%</span>
              </div>
            )}
            <span className={`inline-block mt-2 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-md border ${risk.chip}`}>{risk.label}</span>
          </div>
          <RadialGauge value={shortfallProb * 100} size={74} stroke={6} color={risk.color} colorTo={risk.colorTo}>
            <Activity className="w-4 h-4" style={{ color: risk.color }} />
          </RadialGauge>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[13px] text-text-primary">{isSimActive ? 'Simulated stress scenario' : 'XGBoost shift forecaster'}</div>
          <span className="font-mono text-[10.5px] tracking-widest text-brand-caramel">{isSimActive ? 'OPTIMIZED' : 'STANDBY'}</span>
        </div>
      </Panel>
    </div>
  );
};
