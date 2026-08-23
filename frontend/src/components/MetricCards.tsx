'use client';

import React from 'react';
import { 
  ReserveGridResponse, 
  OperationsTelemetryResponse, 
  SimulationResponse 
} from '@/lib/api';
import { 
  Zap, 
  Satellite, 
  Truck, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface MetricCardsProps {
  reserveData?: ReserveGridResponse | null;
  operationsData?: OperationsTelemetryResponse | null;
  simulationResult?: SimulationResponse | null;
  isLoading?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  reserveData,
  operationsData,
  simulationResult,
  isLoading = false,
}) => {
  // Derive values from simulation if active, else telemetry
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
  const riskLevel = simulationResult?.risk_level ?? operationsData?.current_shift.risk_category ?? 'LOW';

  const getRiskColor = (lvl: string) => {
    switch (lvl) {
      case 'CRITICAL':
        return {
          border: 'border-red-500/60',
          bg: 'bg-surface-card',
          text: 'text-red-400',
          badge: 'bg-red-950/80 text-red-300 border-red-700/60',
          glow: '',
        };
      case 'MODERATE':
        return {
          border: 'border-border-subtle',
          bg: 'bg-surface-card',
          text: 'text-text-primary',
          badge: 'bg-surface-hover text-brand-gold border-brand-gold/50',
          glow: '',
        };
      default:
        return {
          border: 'border-border-subtle',
          bg: 'bg-surface-card',
          text: 'text-text-primary',
          badge: 'bg-surface-hover text-brand-cyan border-brand-cyan/40',
          glow: '',
        };
    }
  };

  const riskTheme = getRiskColor(riskLevel);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 w-full">
      
      {/* Card 1: Shift Ore Extraction Output */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col justify-between border-border-subtle">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">Shift Extraction Output</span>
            <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center text-brand-cyan">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight font-mono">
              {currentOutput.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary font-mono">/ {targetTonnage.toLocaleString()} Tonnes</span>
          </div>

          <div className="mt-3 w-full bg-surface-hover rounded-full h-1.5 overflow-hidden border border-border-subtle">
            <div 
              className="bg-brand-cyan h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, outputRatio)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-brand-cyan font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{outputRatio}% Target Met</span>
          </div>
          <span className="text-text-secondary font-mono">Shift Total</span>
        </div>
      </div>

      {/* Card 2: Spaceborne Manganese Grade & Reserves */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col justify-between border-border-subtle">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">Spaceborne Mn Grade</span>
            <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center text-brand-cyan">
              <Satellite className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight font-mono">
              {gradePct.toFixed(1)}%
            </span>
            <span className="text-xs text-brand-cyan font-mono">Mn Purity</span>
          </div>

          <div className="mt-2 text-[11px] text-text-secondary truncate font-mono">
            {unfcClass}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-text-secondary">Confidence Score:</span>
          <span className="text-brand-cyan font-bold bg-canvas-dark border border-brand-cyan/40 px-2 py-0.5 rounded">
            {confidenceScore.toFixed(1)}% IoU
          </span>
        </div>
      </div>

      {/* Card 3: Active Fleet & Machine Availability */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col justify-between border-border-subtle">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">Active Fleet Health</span>
            <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center text-brand-cyan">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight font-mono">
              {fleetAvail.toFixed(1)}%
            </span>
            <span className="text-xs text-brand-cyan font-mono">Fleet Ready</span>
          </div>

          <div className="mt-2 text-[11px] text-text-secondary flex items-center gap-2">
            <span>{activeDumpers} Haul Trucks</span>
            <span>|</span>
            <span className="font-mono text-text-primary">{haulCycle.toFixed(1)}m Cycle</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-text-secondary">Dispatch Matrix:</span>
          <span className="text-brand-cyan font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            SYNCED
          </span>
        </div>
      </div>

      {/* Card 4: Shortfall Risk & Anomaly Predictor */}
      <div className={`glass-panel rounded-2xl p-4 flex flex-col justify-between border border-border-subtle transition-all`}>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-secondary">Shortfall Risk Index</span>
            <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center text-brand-cyan">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-extrabold tracking-tight font-mono ${riskTheme.text}`}>
              {(shortfallProb * 100).toFixed(1)}%
            </span>
            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border font-semibold ${riskTheme.badge}`}>
              {riskLevel} RISK
            </span>
          </div>

          <div className="mt-2 text-[11px] text-text-secondary">
            {isSimActive ? (
              <span className="text-brand-cyan font-mono flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Simulated Stress Scenario Active
              </span>
            ) : (
              <span>XGBoost Shift Anomaly Forecaster</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-text-secondary">AI Mitigation Plan:</span>
          <span className="text-brand-cyan font-bold">
            {isSimActive ? 'OPTIMIZED' : 'STANDBY'}
          </span>
        </div>
      </div>

    </div>
  );
};
