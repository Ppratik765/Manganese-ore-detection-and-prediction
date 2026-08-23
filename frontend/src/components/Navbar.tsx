'use client';

import React, { useState, useEffect } from 'react';
import { SECTORS_LIST, SectorInfo } from '@/lib/api';
import { 
  Compass, 
  Satellite, 
  Activity, 
  Layers, 
  Sliders, 
  Clock, 
  ShieldCheck, 
  ChevronDown,
  Sparkles,
  Zap
} from 'lucide-react';

interface NavbarProps {
  currentSector: SectorInfo;
  onSelectSector: (sector: SectorInfo) => void;
  onOpenSimulation: () => void;
  isBackendHealthy?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSector,
  onSelectSector,
  onOpenSimulation,
  isBackendHealthy = true,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-canvas-dark/95 border-b border-border-subtle backdrop-blur-md sticky top-0 z-50 px-4 lg:px-6 py-3">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-card border border-brand-cyan/40 flex items-center justify-center shadow-sm">
              <Compass className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base lg:text-lg text-text-primary">
                  MOIL LIMITED
                </span>
                <span className="text-[10px] uppercase tracking-widest font-mono bg-surface-card text-brand-gold border border-brand-gold/40 px-2 py-0.5 rounded font-bold">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-brand-sand font-medium tracking-tight">
                Manganese Reserve AI & Mine Production Shortfall Prevention
              </p>
            </div>
          </div>

          {/* Mobile Sim Trigger */}
          <button
            onClick={onOpenSimulation}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan hover:bg-brand-cyan/90 text-canvas-dark text-xs font-bold shadow-md"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulate</span>
          </button>
        </div>

        {/* Center: Sector Selector Dropdown */}
        <div className="relative w-full md:w-auto flex items-center justify-center">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-card border border-border-subtle hover:border-brand-cyan/60 transition-all text-xs font-medium text-text-primary shadow-inner group"
            >
              <Layers className="w-4 h-4 text-brand-cyan group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] text-brand-sand uppercase tracking-wider font-mono">Mining Sector</div>
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <span>{currentSector.name}</span>
                  <span className="text-[10px] text-brand-gold font-mono">({currentSector.state})</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-brand-cyan' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 md:w-80 bg-surface-card border border-border-subtle rounded-xl shadow-2xl shadow-black/90 backdrop-blur-xl z-50 overflow-hidden py-1.5 divide-y divide-border-subtle">
                <div className="px-3.5 py-2 text-[10px] uppercase font-mono tracking-widest text-brand-sand bg-canvas-dark/80">
                  Select Exploration & Mining Belt
                </div>
                <div className="py-1">
                  {SECTORS_LIST.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectSector(s);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-surface-hover transition-colors ${
                        currentSector.id === s.id ? 'bg-surface-hover border-l-2 border-brand-cyan text-brand-cyan' : 'text-text-secondary'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-text-primary">{s.name}</div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-2 mt-0.5">
                          <span className="text-brand-sand">{s.state}</span>
                          <span>|</span>
                          <span className="font-mono text-brand-gold font-semibold">Mn ~{s.avg_grade_pct}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-canvas-dark text-brand-sand border border-border-subtle px-2 py-0.5 rounded">
                        {s.est_reserves_mt} MT
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          
          {/* Telemetry Status Indicators */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Satellite Live Link */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-[11px] font-mono text-text-primary">
              <Satellite className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
              <span className="text-text-secondary">SAT:</span>
              <span className="text-brand-cyan font-semibold">SENTINEL-2 L2A</span>
            </div>

            {/* AI Model Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-[11px] font-mono text-text-primary">
              <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-brand-cyan shadow-[0_0_8px_#2BBBD7]' : 'bg-brand-gold shadow-[0_0_8px_#FFD758]'}`} />
              <span className="text-text-secondary">AI CORE:</span>
              <span className={isBackendHealthy ? 'text-brand-cyan font-semibold' : 'text-brand-gold font-semibold'}>
                {isBackendHealthy ? 'OPTIMAL' : 'STANDALONE'}
              </span>
            </div>

            {/* Shift Clock in Warm Gold */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-[11px] font-mono text-brand-gold font-semibold">
              <Clock className="w-3.5 h-3.5 text-brand-gold" />
              <span>{currentTime || '12:00:00 IST'}</span>
            </div>
          </div>

          {/* Neural Simulation Modal Trigger */}
          <button
            onClick={onOpenSimulation}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-canvas-dark font-bold text-xs shadow-md shadow-brand-cyan/15 transition-all hover:scale-105 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 fill-canvas-dark" />
            <span>Simulate What-If</span>
          </button>

        </div>

      </div>
    </header>
  );
};
