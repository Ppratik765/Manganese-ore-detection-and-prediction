'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ReserveGridResponse, SectorInfo } from '@/lib/api';
import { 
  Layers, 
  MapPin, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Compass, 
  Sparkles, 
  Crosshair,
  Shield,
  Activity
} from 'lucide-react';

interface GeospatialMapProps {
  currentSector: SectorInfo;
  reserveData?: ReserveGridResponse | null;
  isLoading?: boolean;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({
  currentSector,
  reserveData,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  // Layer toggle states
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showDrillHoles, setShowDrillHoles] = useState<boolean>(true);
  const [showLeaseBoundary, setShowLeaseBoundary] = useState<boolean>(true);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;
      const container = mapContainerRef.current;

      // Clean existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const centroid = currentSector.centroid || [21.825, 80.175];
      const map = L.map(container, {

        center: centroid,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark Matter Tactical Basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      renderLayers(L, map, layerGroup);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentSector]);

  // Re-render layers when toggles or data change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const updateLayers = async () => {
      const L = (await import('leaflet')).default;
      layerGroupRef.current.clearLayers();
      renderLayers(L, mapInstanceRef.current, layerGroupRef.current);
    };

    updateLayers();
  }, [showHeatmap, showDrillHoles, showLeaseBoundary, reserveData]);

  const renderLayers = (L: any, map: any, group: any) => {
    const bbox = currentSector.bbox || [80.10, 21.75, 80.25, 21.90];
    const [minLon, minLat, maxLon, maxLat] = bbox;

    // 1. Concession Lease Boundary Polygon
    if (showLeaseBoundary) {
      const bounds: [number, number][] = [
        [minLat, minLon],
        [maxLat, minLon],
        [maxLat, maxLon],
        [minLat, maxLon],
      ];

      const leasePoly = L.polygon(bounds, {
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#06b6d4',
        fillOpacity: 0.05,
      });

      leasePoly.bindTooltip(`<b>MOIL Concession:</b> ${currentSector.name}`, {
        className: 'bg-slate-900 text-cyan-300 border border-slate-700 text-xs px-2 py-1 rounded font-mono',
        sticky: true,
      });

      group.addLayer(leasePoly);
    }

    // 2. High-Grade Mineral Anomaly Grid Overlay (Heatmap Raster Simulation)
    if (showHeatmap && reserveData?.probability_grid) {
      const grid = reserveData.probability_grid;
      const rows = grid.length;
      const cols = grid[0]?.length || 0;

      const dLat = (maxLat - minLat) / rows;
      const dLon = (maxLon - minLon) / cols;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const prob = grid[r][c];
          if (prob < 0.45) continue; // Filter background non-ore terrain

          const cellMinLat = minLat + (rows - 1 - r) * dLat;
          const cellMaxLat = cellMinLat + dLat;
          const cellMinLon = minLon + c * dLon;
          const cellMaxLon = cellMinLon + dLon;

          // Mineral anomaly color spectrum (Cyan -> Emerald -> Amber -> Red)
          let cellColor = '#06b6d4';
          let opacity = 0.35;
          if (prob >= 0.80) {
            cellColor = '#ef4444'; // Ultra-high grade
            opacity = 0.65;
          } else if (prob >= 0.65) {
            cellColor = '#f59e0b'; // High grade
            opacity = 0.55;
          } else if (prob >= 0.50) {
            cellColor = '#10b981'; // Medium grade
            opacity = 0.45;
          }

          const cellRect = L.rectangle([[cellMinLat, cellMinLon], [cellMaxLat, cellMaxLon]], {
            color: cellColor,
            weight: 0,
            fillColor: cellColor,
            fillOpacity: opacity,
          });

          cellRect.bindTooltip(`Mn Anomaly Prob: ${(prob * 100).toFixed(1)}%`, {
            className: 'bg-slate-900 text-slate-200 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded font-mono',
            sticky: true,
          });

          group.addLayer(cellRect);
        }
      }
    }

    // 3. Exploratory Core Drill Hole Targets
    if (showDrillHoles && reserveData?.drill_hole_targets) {
      reserveData.drill_hole_targets.forEach((target) => {
        const markerIcon = L.divIcon({
          className: 'custom-drill-icon',
          html: `
            <div class="w-6 h-6 rounded-full bg-cyan-950/90 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/50 cursor-pointer hover:scale-125 transition-transform">
              <span class="w-2 h-2 rounded-full ${target.priority === 'HIGH' ? 'bg-rose-400 animate-ping' : 'bg-cyan-400'}"></span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([target.lat, target.lng], { icon: markerIcon });
        marker.on('click', () => setSelectedTarget(target));
        marker.bindTooltip(`<b>${target.target_id}</b> | Target Mn: ${target.estimated_target_grade_pct}%`, {
          className: 'bg-slate-900 text-cyan-200 border border-cyan-800 text-xs px-2 py-1 rounded font-mono',
        });

        group.addLayer(marker);
      });
    }

    // Fit bounds smoothly
    map.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [20, 20] });
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentSector.bbox) {
      const [minLon, minLat, maxLon, maxLat] = currentSector.bbox;
      mapInstanceRef.current.fitBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [20, 20] });
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full relative overflow-hidden border border-slate-800 shadow-2xl">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Geospatial Mineral Heatmap Viewer</h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                10-Channel U-Net
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sentinel-2 multispectral anomaly zones & target core exploration sites
            </p>
          </div>
        </div>

        {/* Layer Toggles & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showHeatmap
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => setShowDrillHoles(!showDrillHoles)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showDrillHoles
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Drill Holes</span>
          </button>

          <button
            onClick={() => setShowLeaseBoundary(!showLeaseBoundary)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showLeaseBoundary
                ? 'bg-purple-950/80 border-purple-700 text-purple-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Lease</span>
          </button>

          <button
            onClick={handleRecenter}
            title="Recenter Map to Sector"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-700 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[420px] lg:h-[490px] rounded-xl overflow-hidden mt-3 bg-slate-950 border border-slate-800">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Telemetry HUD Overlay (Top-Left) */}
        <div className="absolute top-3 left-3 z-[400] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl max-w-xs text-xs font-mono space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[11px] text-cyan-400 font-bold">
            <span>SECTOR HUD</span>
            <span>{currentSector.id.toUpperCase()}</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Center:</span>
              <span>{currentSector.centroid[0].toFixed(3)}°N, {currentSector.centroid[1].toFixed(3)}°E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Formation:</span>
              <span className="truncate max-w-[130px]" title={reserveData?.geological_formation}>
                {reserveData?.geological_formation || 'Sausar Group'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Area Est:</span>
              <span className="text-emerald-400 font-semibold">{reserveData?.delineated_area_km2 ?? 2.14} km²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Clay / Fe Ratio:</span>
              <span className="text-teal-300">
                {reserveData?.spectral_diagnostics.mean_clay_index.toFixed(2)} / {reserveData?.spectral_diagnostics.mean_ferrous_index.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Drill Hole Detail Popup (Bottom-Left) */}
        {selectedTarget && (
          <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 rounded-xl p-3 shadow-2xl max-w-sm text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-800 pb-1">
              <span>🎯 DRILL HOLE: {selectedTarget.target_id}</span>
              <button onClick={() => setSelectedTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="mt-2 space-y-1 text-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Coordinates:</span>
                <span>{selectedTarget.lat}°N, {selectedTarget.lng}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Core Depth:</span>
                <span className="text-cyan-400 font-bold">{selectedTarget.target_depth_m} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Grade:</span>
                <span className="text-emerald-400 font-bold">{selectedTarget.estimated_target_grade_pct}% Mn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prospectivity Confidence:</span>
                <span className="text-amber-400 font-bold">{(selectedTarget.anomaly_probability * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Heatmap Legend (Bottom-Right) */}
        <div className="absolute bottom-3 right-12 z-[400] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-xl text-[10px] font-mono flex items-center gap-2">
          <span className="text-slate-400">Mn Anomaly:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#06b6d4]" title="45-65% (Medium)" />
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" title="50-65%" />
            <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" title="65-80% (High)" />
            <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" title=">80% (Ultra High)" />
          </div>
          <span className="text-rose-400 font-bold">&gt;44% Mn</span>
        </div>

      </div>

    </div>
  );
};
