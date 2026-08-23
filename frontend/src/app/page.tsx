'use client';

import React, { useState, useEffect } from 'react';
import { 
  SECTORS_LIST, 
  SectorInfo, 
  ReserveGridResponse, 
  OperationsTelemetryResponse, 
  SimulationResponse,
  fetchReserveGrid, 
  fetchOperationsTelemetry 
} from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { MetricCards } from '@/components/MetricCards';
import { GeospatialMap } from '@/components/GeospatialMap';
import { ProductionChart } from '@/components/ProductionChart';
import { FleetStatus } from '@/components/FleetStatus';
import { PrescriptiveAlerts } from '@/components/PrescriptiveAlerts';
import { SimulationModal } from '@/components/SimulationModal';
import { RefreshCw, Radio, Sparkles, Layers, Sliders, ShieldAlert } from 'lucide-react';

export default function MissionControlDashboard() {
  const [currentSector, setCurrentSector] = useState<SectorInfo>(SECTORS_LIST[0]);
  const [reserveData, setReserveData] = useState<ReserveGridResponse | null>(null);
  const [operationsData, setOperationsData] = useState<OperationsTelemetryResponse | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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
  }, [currentSector]);

  const handleSelectSector = (sector: SectorInfo) => {
    setCurrentSector(sector);
    setSimulationResult(null); // Reset simulation upon sector switch
    loadSectorData(sector, true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Mission Control Header */}
      <Navbar
        currentSector={currentSector}
        onSelectSector={handleSelectSector}
        onOpenSimulation={() => setIsSimModalOpen(true)}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
        
        {/* Sub-Header Status Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="text-xs font-mono text-slate-300">
              EXPLORATION SECTOR: <strong className="text-cyan-400">{currentSector.name.toUpperCase()}</strong> ({currentSector.state})
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
              Primary Ore: <span className="text-slate-200">{currentSector.primary_mineral}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            {simulationResult && (
              <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold animate-pulse">
                ⚡ WHAT-IF SIMULATION ACTIVE
              </span>
            )}
            <button
              onClick={() => loadSectorData(currentSector, true)}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="text-[11px]">Sync</span>
            </button>
          </div>
        </div>

        {/* 1. Real-Time High-Density Metric Cards */}
        <MetricCards
          reserveData={reserveData}
          operationsData={operationsData}
          simulationResult={simulationResult}
          isLoading={isLoading}
        />

        {/* 2. Main 2-Column Command Center Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          
          {/* Left Column: Geospatial Map + Production Analytics (7 Cols on XL) */}
          <div className="xl:col-span-7 space-y-4">
            {/* Interactive Leaflet Space-Tech Heatmap */}
            <GeospatialMap
              currentSector={currentSector}
              reserveData={reserveData}
              isLoading={isLoading}
            />

            {/* Production vs Target Dual-Axis Chart */}
            <ProductionChart
              operationsData={operationsData}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Prescriptive AI Dispatch Feed + Heavy Fleet Health (5 Cols on XL) */}
          <div className="xl:col-span-5 space-y-4">
            {/* Real-Time Prescriptive Mitigation Actions Feed */}
            <PrescriptiveAlerts
              simulationResult={simulationResult}
              defaultPlan={null}
            />

            {/* Machine Fleet Telemetry Grid */}
            <FleetStatus
              operationsData={operationsData}
              isLoading={isLoading}
            />
          </div>

        </div>

      </main>

      {/* Interactive Scenario Simulation Control Modal */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        currentSector={currentSector}
        onSimulationComplete={(res) => setSimulationResult(res)}
        onResetSimulation={() => setSimulationResult(null)}
      />

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MOIL LIMITED &copy; {new Date().getFullYear()} — Smart India Hackathon (SIH 2026) Project
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Sentinel-2 L2A Multispectral</span>
            <span>•</span>
            <span>10-Channel U-Net ONNX</span>
            <span>•</span>
            <span>XGBoost Prescriptive AI</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
