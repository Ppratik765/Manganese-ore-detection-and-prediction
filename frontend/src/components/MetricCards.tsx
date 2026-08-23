'use client';

import React from 'react';
import { ReserveGridResponse, OperationsTelemetryResponse, SimulationResponse } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Truck, 
  AlertTriangle, 
  ShieldCheck, 
  Gauge, 
  Layers, 
  Zap,
  Activity
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
          border: 'border-rose-500/50',
          bg: 'bg-rose-950/20',
          text: 'text-rose-400',
          badge: 'bg-rose-900/60 text-rose-300 border-rose-700/60',
          glow: 'shadow-[0_0_20px_-3px_rgba(244,63,94,0.3)]',
        };
      case 'MODERATE':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-950/20',
          text: 'text-amber-400',
          badge: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
          glow: 'shadow-[0_0_20px_-3px_rgba(245,158,11,0.3)]',
        };
      default:
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/20',
          text: 'text-emerald-400',
          badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
          glow: 'shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)]',
        };
    }
  };

  const riskTheme = getRiskColor(riskLevel);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 w-full">
      
      {/* Card 1: Shift Ore Extraction Output */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Shift Extraction Output</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight telemetry-mono">
              {currentOutput.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {targetTonnage.toLocaleString()} Tonnes</span>
          </div>

          <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, outputRatio)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{outputRatio}% Target Met</span>
          </div>
          <span className="text-slate-500 font-mono">Shift Total</span>
        </div>
      </div>

      {/* Card 2: Spaceborne Manganese Grade & Reserves */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Spaceborne Mn Grade</span>
            <div className="w-7 h-7 rounded-lg bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-teal-300 tracking-tight telemetry-mono">
              {gradePct.toFixed(1)}%
            </span>
            <span className="text-xs text-teal-400/80 font-mono">Mn Purity</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {unfcClass}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Confidence:</span>
          <span className="text-teal-300 font-bold bg-teal-950/80 border border-teal-800/50 px-2 py-0.5 rounded">
            {confidenceScore.toFixed(1)}% IoU
          </span>
        </div>
      </div>

      {/* Card 3: Active Fleet & Machine Availability */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Active Fleet Health</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-emerald-300 tracking-tight telemetry-mono">
              {fleetAvail.toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-400/80 font-mono">Fleet Ready</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span>{activeDumpers} Haul Trucks</span>
            <span>•</span>
            <span className="font-mono text-slate-300">{haulCycle.toFixed(1)}m Cycle</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Dispatch Status:</span>
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYNCED
          </span>
        </div>
      </div>

      {/* Card 4: Shortfall Risk & Anomaly Predictor */}
      <div className={`glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all ${riskTheme.border} ${riskTheme.glow}`}>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Production Shortfall Risk</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${riskTheme.badge}`}>
              {riskLevel === 'LOW' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-extrabold tracking-tight telemetry-mono ${riskTheme.text}`}>
              {(shortfallProb * 100).toFixed(1)}%
            </span>
            <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${riskTheme.badge}`}>
              {riskLevel} RISK
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            {isSimActive ? 'Dynamic What-If Simulation' : 'Live XGBoost Continuous Risk'}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">AI Mitigation:</span>
          <span className="text-cyan-300 font-bold underline cursor-pointer hover:text-cyan-200">
            {simulationResult ? `${simulationResult.prescriptive_optimization.action_count} Action(s)` : 'Optimal Active'}
          </span>
        </div>
      </div>

    </div>
  );
};
