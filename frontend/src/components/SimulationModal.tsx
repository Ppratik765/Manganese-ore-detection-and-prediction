'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SectorInfo, SimulationRequestPayload, SimulationResponse, simulateOperations } from '@/lib/api';
import { Sliders, X, Play, RotateCcw, CloudRain, Clock, Truck, AlertTriangle, Flame, CheckCircle2, Activity, Gauge, ShieldAlert, Loader2 } from 'lucide-react';
import { Range } from '@/components/ui/Range';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSector: SectorInfo;
  onSimulationComplete: (result: SimulationResponse) => void;
  onResetSimulation: () => void;
}

type Preset = 'normal' | 'monsoon' | 'blast_jam' | 'shovel_fail';

export const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, currentSector, onSimulationComplete, onResetSimulation }) => {
  const [rainfall, setRainfall] = useState<number>(0);
  const [pitWater, setPitWater] = useState<number>(0.8);
  const [blastDelay, setBlastDelay] = useState<number>(0.5);
  const [fragmentation, setFragmentation] = useState<number>(20);
  const [fleetAvail, setFleetAvail] = useState<number>(92);
  const [activeDumpers, setActiveDumpers] = useState<number>(currentSector.active_fleet_count || 12);
  const [haulCycle, setHaulCycle] = useState<number>(24);
  const [machineFailure, setMachineFailure] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Keep the default fleet size in step with the selected sector.
  useEffect(() => {
    setActiveDumpers(currentSector.active_fleet_count || 12);
  }, [currentSector.id, currentSector.active_fleet_count]);

  // Escape to close + lock page scroll while the sheet is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const applyPreset = (type: Preset) => {
    setActivePreset(type);
    switch (type) {
      case 'normal':
        setRainfall(0); setPitWater(0.6); setBlastDelay(0.2); setFragmentation(18); setFleetAvail(96); setActiveDumpers(12); setHaulCycle(22); setMachineFailure(false);
        break;
      case 'monsoon':
        setRainfall(58); setPitWater(2.8); setBlastDelay(1.8); setFragmentation(26); setFleetAvail(78); setActiveDumpers(8); setHaulCycle(36); setMachineFailure(false);
        break;
      case 'blast_jam':
        setRainfall(10); setPitWater(1.1); setBlastDelay(3.2); setFragmentation(42); setFleetAvail(84); setActiveDumpers(10); setHaulCycle(28); setMachineFailure(false);
        break;
      case 'shovel_fail':
        setRainfall(15); setPitWater(1.4); setBlastDelay(1.0); setFragmentation(24); setFleetAvail(62); setActiveDumpers(6); setHaulCycle(42); setMachineFailure(true);
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
    setActivePreset(null);
    onResetSimulation();
    onClose();
  };

  const presets: { id: Preset; label: string; icon: React.ReactNode; tone: string }[] = [
    { id: 'normal', label: 'Standard shift', icon: <CheckCircle2 className="w-4 h-4" />, tone: '#8a9a52' },
    { id: 'monsoon', label: 'Monsoon surge', icon: <CloudRain className="w-4 h-4" />, tone: '#dda15e' },
    { id: 'blast_jam', label: 'Blast choking', icon: <Flame className="w-4 h-4" />, tone: '#e2703a' },
    { id: 'shovel_fail', label: 'Shovel fault', icon: <AlertTriangle className="w-4 h-4" />, tone: '#e5634d' },
  ];

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setActivePreset(null);
    setter(v);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Mine operations stress-test simulation">
          <motion.div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          <motion.aside
            className="absolute right-0 top-0 h-full w-full max-w-[540px] flex flex-col bg-ink-800/95 backdrop-blur-2xl border-l border-white/10 shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.9)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-white/[0.07] flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-brand-caramel mb-2 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> What-if simulation
                </div>
                <h2 className="font-display text-[26px] leading-tight text-text-primary" style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 50" }}>
                  Operations stress test
                </h2>
                <p className="text-[12.5px] text-text-secondary mt-1.5 max-w-sm leading-relaxed">
                  Simulate weather surges, blasting bottlenecks and fleet breakdown to trigger the prescriptive AI for{' '}
                  <span className="text-text-primary">{currentSector.name}</span>.
                </p>
              </div>
              <button ref={closeRef} onClick={onClose} aria-label="Close simulation" className="btn-ghost w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="eyebrow mb-3">Preset scenarios</div>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => {
                  const on = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-2.5 px-3.5 h-11 rounded-xl border text-[13px] text-left transition-all duration-300 ${on ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]'}`}
                      style={on ? { borderColor: `${p.tone}88`, background: `${p.tone}1a` } : undefined}
                    >
                      <span style={{ color: p.tone }}>{p.icon}</span>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="hairline my-6" />

              <div className="eyebrow mb-1">Environment</div>
              <div className="divide-y divide-white/[0.05]">
                <Range label="Rainfall rate" icon={<CloudRain className="w-3.5 h-3.5" />} value={rainfall} min={0} max={100} step={2} unit="mm/hr" color="#8a9a52" onChange={touch(setRainfall)} />
                <Range label="Pit sump water depth" icon={<Gauge className="w-3.5 h-3.5" />} value={pitWater} min={0.2} max={4.5} step={0.1} decimals={1} unit="m" color="#8a9a52" onChange={touch(setPitWater)} />
              </div>

              <div className="eyebrow mt-5 mb-1">Blasting</div>
              <div className="divide-y divide-white/[0.05]">
                <Range label="Misfire / safety delay" icon={<Clock className="w-3.5 h-3.5" />} value={blastDelay} min={0} max={5} step={0.2} decimals={1} unit="hrs" color="#e2703a" onChange={touch(setBlastDelay)} />
                <Range
                  label="Fragmentation (P80)"
                  icon={<Flame className="w-3.5 h-3.5" />}
                  value={fragmentation}
                  min={12}
                  max={48}
                  step={1}
                  unit="cm"
                  color={fragmentation > 30 ? '#e2703a' : '#dda15e'}
                  note={fragmentation > 30 ? 'crusher choke' : undefined}
                  noteTone="warn"
                  onChange={touch(setFragmentation)}
                />
              </div>

              <div className="eyebrow mt-5 mb-1">Fleet</div>
              <div className="divide-y divide-white/[0.05]">
                <Range label="Fleet availability" icon={<Truck className="w-3.5 h-3.5" />} value={fleetAvail} min={40} max={100} step={2} unit="%" color="#dda15e" onChange={touch(setFleetAvail)} />
                <Range label="Average haul cycle" icon={<Activity className="w-3.5 h-3.5" />} value={haulCycle} min={15} max={55} step={1} unit="min" color="#dda15e" onChange={touch(setHaulCycle)} />
              </div>

              <div className="hairline my-6" />

              {/* Failure switch */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${machineFailure ? 'bg-danger/15 text-danger' : 'bg-white/[0.04] text-text-muted'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-[13px] text-text-primary">Critical shovel / excavator failure</div>
                    <div className="text-[11.5px] text-text-muted">Triggers AI dynamic rerouting mitigation</div>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={machineFailure}
                  aria-label="Simulate critical equipment failure"
                  onClick={() => touch(setMachineFailure)(!machineFailure)}
                  className={`relative w-12 h-7 rounded-full shrink-0 transition-colors duration-300 ${machineFailure ? 'bg-danger' : 'bg-white/[0.12]'}`}
                >
                  <motion.span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow" animate={{ x: machineFailure ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.07] bg-ink-900/60 flex items-center justify-between gap-3">
              <button onClick={handleReset} className="btn-ghost flex items-center gap-2 px-3.5 h-10 rounded-xl text-[12.5px] text-text-secondary hover:text-text-primary">
                <RotateCcw className="w-3.5 h-3.5" />
                Reset baseline
              </button>
              <button onClick={handleRunSimulation} disabled={isSubmitting} className="btn-primary flex items-center gap-2 px-5 h-10 rounded-xl text-[13px] font-semibold disabled:opacity-60 disabled:cursor-wait">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isSubmitting ? 'Computing optimization' : 'Run neural simulation'}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
