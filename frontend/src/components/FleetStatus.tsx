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
  SlidersHorizontal,
  Wrench
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
          bg: 'bg-surface-card text-brand-gold border-brand-gold/50',
          dot: 'bg-brand-gold animate-pulse',
        };
      case 'CRITICAL_LOAD':
        return {
          bg: 'bg-red-950/80 text-red-300 border-red-700/60',
          dot: 'bg-red-400 animate-ping',
        };
      case 'STANDBY':
        return {
          bg: 'bg-canvas-dark text-text-secondary border-border-subtle',
          dot: 'bg-text-secondary',
        };
      default:
        return {
          bg: 'bg-surface-card text-brand-cyan border-brand-cyan/40',
          dot: 'bg-brand-cyan',
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full border border-border-subtle shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center text-brand-cyan">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Heavy Fleet Telemetry & Predictive Health</h3>
              <span className="text-[10px] font-mono text-brand-cyan bg-canvas-dark border border-brand-cyan/40 px-2 py-0.5 rounded font-semibold">
                AI4I Ingested Logs
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Live mechanical strain, torque, thermal load, and machine failure risk scoring
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-text-secondary flex items-center gap-2">
          <span>Active Units: <strong className="text-brand-cyan font-bold">{fleet.filter(f => f.status === 'OPERATIONAL').length}</strong> / {fleet.length}</span>
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
              className={`p-3.5 rounded-xl bg-surface-card border transition-all hover:bg-surface-hover ${
                isHighRisk ? 'border-brand-gold/60 shadow-lg shadow-brand-gold/10' : 'border-border-subtle hover:border-brand-cyan/50'
              }`}
            >
              {/* Top Row: ID + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-extrabold text-sm text-text-primary font-mono">{machine.equipment_id}</div>
                  <span className="text-[11px] text-text-secondary font-medium">({machine.model})</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span>{machine.status}</span>
                </div>
              </div>

              {/* Machine Type */}
              <div className="text-[11px] text-brand-sand mt-1 font-medium flex items-center gap-1">
                <Wrench className="w-3 h-3 text-text-secondary" />
                <span>{machine.type}</span>
              </div>

              {/* Telemetry Gauge Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border-subtle text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-text-secondary block uppercase">Torque / RPM</span>
                  <span className="font-bold text-text-primary">{machine.torque_nm} Nm</span>
                  <span className="text-[10px] text-text-secondary block">{machine.rpm} rpm</span>
                </div>

                <div>
                  <span className="text-[10px] text-text-secondary block uppercase">Temperature</span>
                  <span className={`font-bold ${machine.temp_c > 42 ? 'text-brand-gold' : 'text-brand-cyan'}`}>
                    {machine.temp_c}°C
                  </span>
                  <span className="text-[10px] text-text-secondary block">Wear {machine.tool_wear_min}m</span>
                </div>

                <div>
                  <span className="text-[10px] text-text-secondary block uppercase">Failure Risk</span>
                  <span className={`font-bold ${isHighRisk ? 'text-brand-gold' : 'text-brand-cyan'}`}>
                    {machine.failure_risk_pct.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-text-secondary block">Strain {machine.strain_index.toFixed(1)}</span>
                </div>
              </div>

              {/* Operator Footnote */}
              <div className="mt-2.5 pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[10px] text-text-secondary font-mono">
                <span className="truncate max-w-[200px]">Op: {machine.operator}</span>
                {isHighRisk && (
                  <span className="text-brand-gold font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-brand-gold" />
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
