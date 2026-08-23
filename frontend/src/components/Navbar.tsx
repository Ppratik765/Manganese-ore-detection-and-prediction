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
  Sparkles
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
    <header className="w-full bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-6 py-3">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base lg:text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  MOIL LIMITED
                </span>
                <span className="text-[10px] uppercase tracking-widest font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                Manganese Reserve AI & Mine Production Shortfall Prevention
              </p>
            </div>
          </div>

          {/* Mobile Sim Trigger */}
          <button
            onClick={onOpenSimulation}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-xs font-semibold shadow-md"
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
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 transition-all text-xs font-medium text-slate-200 shadow-inner group"
            >
              <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Mining Sector</div>
                <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <span>{currentSector.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">({currentSector.state})</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 md:w-80 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl shadow-black/80 backdrop-blur-xl z-50 overflow-hidden py-1.5 divide-y divide-slate-800">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-slate-400 bg-slate-950/60">
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
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                        currentSector.id === s.id ? 'bg-cyan-950/40 border-l-2 border-cyan-400 text-cyan-200' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-100">{s.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{s.state}</span>
                          <span>•</span>
                          <span className="font-mono text-cyan-400">Mn ~{s.avg_grade_pct}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
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
          <div className="hidden lg:flex items-center gap-3">
            {/* Satellite Live Link */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
              <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-400">SAT:</span>
              <span className="text-emerald-400 font-semibold">SENTINEL-2 L2A</span>
            </div>

            {/* AI Model Status */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'}`} />
              <span className="text-slate-400">AI CORE:</span>
              <span className={isBackendHealthy ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {isBackendHealthy ? 'OPTIMAL' : 'STANDALONE'}
              </span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime || '12:00:00 IST'}</span>
            </div>
          </div>

          {/* Desktop Scenario Simulator Button */}
          <button
            onClick={onOpenSimulation}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Sliders className="w-4 h-4 text-slate-950" />
            <span>Simulate What-If</span>
          </button>

        </div>

      </div>
    </header>
  );
};
