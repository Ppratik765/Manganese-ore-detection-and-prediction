'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  SECTORS_LIST,
  SectorInfo,
  ReserveGridResponse,
  OperationsTelemetryResponse,
  SimulationResponse,
  fetchReserveGrid,
  fetchOperationsTelemetry,
} from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { MetricCards } from '@/components/MetricCards';
import { GeospatialMap } from '@/components/GeospatialMap';
import { ProductionChart } from '@/components/ProductionChart';
import { FleetStatus } from '@/components/FleetStatus';
import { PrescriptiveAlerts } from '@/components/PrescriptiveAlerts';
import { SimulationModal } from '@/components/SimulationModal';
import { RefreshCw, Sliders, Activity, Satellite, Cpu, MapPin, Gem } from 'lucide-react';

export default function MissionControlDashboard() {
  const [currentSector, setCurrentSector] = useState<SectorInfo>(SECTORS_LIST[0]);
  const [reserveData, setReserveData] = useState<ReserveGridResponse | null>(null);
  const [operationsData, setOperationsData] = useState<OperationsTelemetryResponse | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);

  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Load Sector Data
  const loadSectorData = async (sector: SectorInfo, showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const [reserves, operations] = await Promise.all([
        fetchReserveGrid(sector.id, 32),
        fetchOperationsTelemetry(sector.id),
      ]);
      setReserveData(reserves);
      setOperationsData(operations);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load sector telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSectorData(currentSector);
    const interval = setInterval(() => {
      loadSectorData(currentSector, false);
    }, 25000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSector]);

  const handleSelectSector = (sector: SectorInfo) => {
    setCurrentSector(sector);
    setSimulationResult(null); // Reset simulation upon sector switch
    loadSectorData(sector, true);
  };

  return (
    <div className="min-h-screen text-text-primary flex flex-col">
      {/* Top Mission Control Header */}
      <Navbar currentSector={currentSector} onSelectSector={handleSelectSector} onOpenSimulation={() => setIsSimModalOpen(true)} />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-4 lg:px-6 pt-8 pb-10 space-y-6">
        {/* Hero strip */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 px-1">
          <div className="min-w-0">
            <div className="eyebrow flex items-center gap-2.5 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-caramel animate-ping-soft" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-caramel" />
              </span>
              Exploration sector · live
            </div>

            <div className="relative min-h-[3.2rem] sm:min-h-[4rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h1
                  key={currentSector.id}
                  initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-[34px] sm:text-[46px] lg:text-[54px] leading-[1.02] text-text-primary tracking-tight"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60" }}
                >
                  {currentSector.name}
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-primary">
                <MapPin className="w-3.5 h-3.5 text-brand-caramel" />
                {currentSector.state}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-primary">
                <Gem className="w-3.5 h-3.5 text-brand-caramel" />
                {currentSector.primary_mineral}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-text-secondary">{currentSector.mine_type}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <AnimatePresence>
              {simulationResult && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3.5 h-10 rounded-xl border border-brand-ember/45 bg-brand-ember/10 text-brand-ember font-mono text-[11px] tracking-wider"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  WHAT-IF ACTIVE
                </motion.span>
              )}
            </AnimatePresence>

            {lastRefreshed && (
              <span className="hidden sm:block font-mono text-[11px] text-text-muted">
                Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour12: false })}
              </span>
            )}

            <button
              onClick={() => loadSectorData(currentSector, true)}
              disabled={isRefreshing}
              className="btn-ghost flex items-center gap-2 px-4 h-10 rounded-xl text-[12.5px] text-text-primary disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-caramel' : 'text-text-secondary'}`} />
              Sync telemetry
            </button>
          </div>
        </section>

        {/* 1. Metric cards */}
        <MetricCards reserveData={reserveData} operationsData={operationsData} simulationResult={simulationResult} isLoading={isLoading} />

        {/* 2. Command-center workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-7 space-y-4 min-w-0">
            <GeospatialMap currentSector={currentSector} reserveData={reserveData} isLoading={isLoading} />
            <ProductionChart operationsData={operationsData} isLoading={isLoading} />
          </div>

          <div className="xl:col-span-5 space-y-4 min-w-0">
            <PrescriptiveAlerts simulationResult={simulationResult} defaultPlan={null} />
            <FleetStatus operationsData={operationsData} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {/* Scenario simulation sheet */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        currentSector={currentSector}
        onSimulationComplete={(res) => setSimulationResult(res)}
        onResetSimulation={() => setSimulationResult(null)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.07] bg-ink-900/60 backdrop-blur-xl">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="font-display text-[17px] text-text-primary" style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 50" }}>
              MOIL Limited
            </div>
            <div className="font-mono text-[11px] text-text-muted mt-1">&copy; {new Date().getFullYear()} · Smart India Hackathon (SIH 2026) Platform</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-text-secondary">
            <span className="flex items-center gap-2"><Satellite className="w-3.5 h-3.5 text-brand-caramel" />Sentinel-2 L2A multispectral</span>
            <span className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-brand-caramel" />10-channel U-Net ONNX</span>
            <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-brand-caramel" />XGBoost prescriptive AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
