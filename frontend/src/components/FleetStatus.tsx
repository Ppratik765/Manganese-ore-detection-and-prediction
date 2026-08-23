'use client';

import React from 'react';
import { OperationsTelemetryResponse, LiveMachineTelemetry } from '@/lib/api';
import { 
  Truck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Thermometer, 
  Gauge, 
  Clock, 
  Cpu,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

interface FleetStatusProps {
  operationsData?: OperationsTelemetryResponse | null;
  isLoading?: boolean;
}

export const FleetStatus: React.FC<FleetStatusProps> = ({
  operationsData,
  isLoading = false,
}) => {
  const fleet = operationsData?.live_equipment_fleet || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WARNING':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'CRITICAL_LOAD':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
          dot: 'bg-rose-400 animate-ping',
        };
      case 'STANDBY':
        return {
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-400',
        };
      default:
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
          dot: 'bg-emerald-400',
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full border border-slate-800 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Heavy Fleet Telemetry & Predictive Health</h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                AI4I Ingested Logs
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live mechanical strain, torque, thermal load, and machine failure risk scoring
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Active Units: <strong className="text-emerald-400">{fleet.filter(f => f.status === 'OPERATIONAL').length}</strong> / {fleet.length}</span>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3.5">
        {fleet.map((machine) => {
          const badge = getStatusBadge(machine.status);
          const isHighRisk = machine.failure_risk_pct > 25.0;

          return (
            <div
              key={machine.equipment_id}
              className={`p-3.5 rounded-xl bg-slate-900/70 border transition-all hover:bg-slate-900/90 ${
                isHighRisk ? 'border-amber-500/40 shadow-lg shadow-amber-500/10' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Top Row: ID + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-sm text-slate-100 telemetry-mono">{machine.equipment_id}</div>
                  <span className="text-[11px] text-slate-400 font-medium">({machine.model})</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span>{machine.status}</span>
                </div>
              </div>

              {/* Machine Type */}
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {machine.type}
              </div>

              {/* Telemetry Gauge Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Torque / RPM</span>
                  <span className="font-bold text-slate-200">{machine.torque_nm} Nm</span>
                  <span className="text-[10px] text-slate-400 block">{machine.rpm} rpm</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Temp (Process)</span>
                  <span className={`font-bold ${machine.temp_c > 42 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {machine.temp_c}°C
                  </span>
                  <span className="text-[10px] text-slate-400 block">Wear {machine.tool_wear_min}m</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Failure Risk</span>
                  <span className={`font-bold ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {machine.failure_risk_pct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Strain: {machine.strain_index.toFixed(1)}</span>
                </div>
              </div>

              {/* Operator Footnote */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate max-w-[200px]">Op: {machine.operator}</span>
                {isHighRisk && (
                  <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    INSPECT
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
