'use client';

import React, { useState } from 'react';
import { SectorInfo, SimulationRequestPayload, SimulationResponse, simulateOperations } from '@/lib/api';
import { 
  Sliders, 
  X, 
  Play, 
  RotateCcw, 
  CloudRain, 
  Clock, 
  Truck, 
  AlertTriangle, 
  Zap, 
  Sparkles,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSector: SectorInfo;
  onSimulationComplete: (result: SimulationResponse) => void;
  onResetSimulation: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  currentSector,
  onSimulationComplete,
  onResetSimulation,
}) => {
  // Simulation Input States
  const [rainfall, setRainfall] = useState<number>(0);
  const [pitWater, setPitWater] = useState<number>(0.8);
  const [blastDelay, setBlastDelay] = useState<number>(0.5);
  const [fragmentation, setFragmentation] = useState<number>(20);
  const [fleetAvail, setFleetAvail] = useState<number>(92);
  const [activeDumpers, setActiveDumpers] = useState<number>(currentSector.active_fleet_count || 12);
  const [haulCycle, setHaulCycle] = useState<number>(24);
  const [machineFailure, setMachineFailure] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Preset Scenario Handlers
  const applyPreset = (type: 'normal' | 'monsoon' | 'blast_jam' | 'shovel_fail') => {
    switch (type) {
      case 'normal':
        setRainfall(0);
        setPitWater(0.6);
        setBlastDelay(0.2);
        setFragmentation(18);
        setFleetAvail(96);
        setActiveDumpers(12);
        setHaulCycle(22);
        setMachineFailure(false);
        break;
      case 'monsoon':
        setRainfall(58);
        setPitWater(2.8);
        setBlastDelay(1.8);
        setFragmentation(26);
        setFleetAvail(78);
        setActiveDumpers(8);
        setHaulCycle(36);
        setMachineFailure(false);
        break;
      case 'blast_jam':
        setRainfall(10);
        setPitWater(1.1);
        setBlastDelay(3.2);
        setFragmentation(42);
        setFleetAvail(84);
        setActiveDumpers(10);
        setHaulCycle(28);
        setMachineFailure(false);
        break;
      case 'shovel_fail':
        setRainfall(15);
        setPitWater(1.4);
        setBlastDelay(1.0);
        setFragmentation(24);
        setFleetAvail(62);
        setActiveDumpers(6);
        setHaulCycle(42);
        setMachineFailure(true);
        break;
    }
  };

  const handleRunSimulation = async () => {
    setIsSubmitting(true);
    try {
      const roadFriction = Number(Math.max(0.35, Math.min(0.9, 0.85 - 0.005 * rainfall)).toFixed(3));
      const payload: SimulationRequestPayload = {
        sector: currentSector.id,
        shift: 'Shift_A_Morning',
        rainfall_mm: rainfall,
        pit_water_level_m: pitWater,
        road_friction_coeff: roadFriction,
        p80_fragmentation_cm: fragmentation,
        blast_delay_hrs: blastDelay,
        fleet_availability_pct: fleetAvail,
        active_dumpers: activeDumpers,
        haul_cycle_mins: haulCycle,
        machine_failure_simulated: machineFailure ? 1 : 0,
        target_tonnage_override: currentSector.target_tonnage_shift,
      };

      const result = await simulateOperations(payload);
      onSimulationComplete(result);
      onClose();
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    applyPreset('normal');
    onResetSimulation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 divide-y divide-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 p-[1px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sliders className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Mine Operations Stress-Test Lab</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                  {currentSector.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulate weather surges, blasting bottlenecks & fleet breakdown to trigger Prescriptive AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Strip */}
        <div className="p-4 bg-slate-950/40">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            ⚡ Quick Stress Scenarios:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <button
              onClick={() => applyPreset('normal')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-left transition-colors"
            >
              🟢 Baseline Shift
            </button>
            <button
              onClick={() => applyPreset('monsoon')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 text-left transition-colors"
            >
              🌧️ Heavy Monsoon
            </button>
            <button
              onClick={() => applyPreset('blast_jam')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 text-left transition-colors"
            >
              💥 Blast Choking
            </button>
            <button
              onClick={() => applyPreset('shovel_fail')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-left transition-colors"
            >
              ⚠️ Shovel Breakdown
            </button>
          </div>
        </div>

        {/* Interactive Sliders Body */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Slider 1: Rainfall */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                Precipitation / Rainfall Rate:
              </span>
              <span className="text-cyan-400 font-bold">{rainfall} mm/hr</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={2}
              value={rainfall}
              onChange={(e) => setRainfall(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Slider 2: Pit Water Depth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Pit Sump Water Depth:</span>
              <span className="text-cyan-400 font-bold">{pitWater.toFixed(1)} meters</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={4.5}
              step={0.1}
              value={pitWater}
              onChange={(e) => setPitWater(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Slider 3: Blasting Delay */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Blasting Safety / Misfire Delay:
              </span>
              <span className="text-amber-400 font-bold">{blastDelay.toFixed(1)} hrs</span>
            </div>
            <input
              type="range"
              min={0}
              max={5.0}
              step={0.2}
              value={blastDelay}
              onChange={(e) => setBlastDelay(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Slider 4: Blasting Fragmentation P80 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Blasting Fragmentation (P80 Particle Size):</span>
              <span className={fragmentation > 30 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {fragmentation} cm {fragmentation > 30 ? '(Crusher Choke Risk)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={48}
              step={1}
              value={fragmentation}
              onChange={(e) => setFragmentation(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Slider 5: Fleet Availability */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                Active Fleet Availability:
              </span>
              <span className="text-emerald-400 font-bold">{fleetAvail}%</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              step={2}
              value={fleetAvail}
              onChange={(e) => setFleetAvail(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Slider 6: Haul Cycle Time */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Average Haul Cycle Duration:</span>
              <span className="text-cyan-400 font-bold">{haulCycle} mins</span>
            </div>
            <input
              type="range"
              min={15}
              max={55}
              step={1}
              value={haulCycle}
              onChange={(e) => setHaulCycle(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Toggle: Machine Failure */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Simulate Major Shovel Breakdown</div>
              <div className="text-[11px] text-slate-400">Simulates catastrophic hydraulic pump failure on CAT 6020 #1</div>
            </div>
            <button
              onClick={() => setMachineFailure(!machineFailure)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                machineFailure ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                  machineFailure ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 flex items-center justify-between bg-slate-950/80 sticky bottom-0 z-10">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isSubmitting ? 'Computing Neural Optimization...' : 'Run Neural Simulation'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
