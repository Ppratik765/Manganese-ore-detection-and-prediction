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
  Activity,
  X,
  Satellite
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
        color: '#2BBBD7',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#218DAE',
        fillOpacity: 0.08,
      });

      leasePoly.bindTooltip(`<b>MOIL Mining Lease:</b> ${currentSector.name}`, {
        className: 'bg-surface-card text-brand-cyan border border-border-subtle text-xs px-2 py-1 rounded font-mono',
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

          // Designated Brand Anomaly Spectrum:
          // Low: #218DAE (brand-teal)
          // Moderate: #2BBBD7 (brand-cyan)
          // High Grade: #FCE59A (brand-sand)
          // Peak Deposit: #FFD758 (brand-gold)
          let cellColor = '#218DAE';
          let opacity = 0.40;
          if (prob >= 0.80) {
            cellColor = '#FFD758'; // Peak Deposit (>44% Mn)
            opacity = 0.75;
          } else if (prob >= 0.70) {
            cellColor = '#FCE59A'; // High-Grade Mineralized Gossan
            opacity = 0.65;
          } else if (prob >= 0.55) {
            cellColor = '#2BBBD7'; // Moderate Hydrothermal Alteration
            opacity = 0.50;
          }

          const cellRect = L.rectangle([[cellMinLat, cellMinLon], [cellMaxLat, cellMaxLon]], {
            color: cellColor,
            weight: 0,
            fillColor: cellColor,
            fillOpacity: opacity,
          });

          cellRect.bindTooltip(`Mn Prospectivity: ${(prob * 100).toFixed(1)}%`, {
            className: 'bg-surface-card text-text-primary border border-border-subtle text-[10px] px-2 py-1 rounded font-mono',
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
            <div class="w-6 h-6 rounded-full bg-canvas-dark/90 border-2 border-brand-gold flex items-center justify-center shadow-lg shadow-brand-gold/40 cursor-pointer hover:scale-125 transition-transform">
              <span class="w-2 h-2 rounded-full ${target.priority === 'HIGH' ? 'bg-brand-gold animate-ping' : 'bg-brand-cyan'}"></span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([target.lat, target.lng], { icon: markerIcon });
        marker.on('click', () => setSelectedTarget(target));
        marker.bindTooltip(`<b>${target.target_id}</b> | Target Mn: ${target.estimated_target_grade_pct}%`, {
          className: 'bg-surface-card text-brand-sand border border-brand-gold/50 text-xs px-2 py-1 rounded font-mono',
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
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full relative overflow-hidden border border-border-subtle shadow-2xl">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center text-brand-cyan">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Geospatial Mineral Prospectivity Map</h3>
              <span className="text-[10px] font-mono text-brand-cyan bg-canvas-dark border border-brand-cyan/40 px-2 py-0.5 rounded font-semibold">
                10-Channel U-Net
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Sentinel-2 multispectral anomaly zones & target core exploration sites
            </p>
          </div>
        </div>

        {/* Layer Toggles & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showHeatmap
                ? 'bg-surface-card border-brand-cyan text-brand-cyan shadow-sm'
                : 'bg-canvas-dark border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => setShowDrillHoles(!showDrillHoles)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showDrillHoles
                ? 'bg-surface-card border-brand-cyan text-brand-cyan shadow-sm'
                : 'bg-canvas-dark border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Drill Holes</span>
          </button>

          <button
            onClick={() => setShowLeaseBoundary(!showLeaseBoundary)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              showLeaseBoundary
                ? 'bg-surface-card border-brand-cyan text-brand-cyan shadow-sm'
                : 'bg-canvas-dark border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Lease</span>
          </button>

          <button
            onClick={handleRecenter}
            title="Recenter Map to Sector"
            className="p-1.5 rounded-lg bg-surface-card border border-border-subtle text-text-secondary hover:text-brand-cyan hover:border-brand-cyan transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[420px] lg:h-[490px] rounded-xl overflow-hidden mt-3 bg-canvas-dark border border-border-subtle">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Telemetry HUD Overlay (Top-Left) */}
        <div className="absolute top-3 left-3 z-[400] bg-canvas-dark/90 backdrop-blur-md border border-border-subtle rounded-xl p-3 shadow-xl max-w-xs text-xs font-mono space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-border-subtle pb-1 text-[11px] text-brand-cyan font-bold">
            <span>SECTOR HUD</span>
            <span>{currentSector.id.toUpperCase()}</span>
          </div>
          <div className="text-[11px] text-text-primary space-y-0.5">
            <div className="flex justify-between">
              <span className="text-text-secondary">Center:</span>
              <span>{currentSector.centroid[0].toFixed(3)}°N, {currentSector.centroid[1].toFixed(3)}°E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Formation:</span>
              <span className="truncate max-w-[130px] text-brand-sand" title={reserveData?.geological_formation}>
                {reserveData?.geological_formation || 'Sausar Group'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Delineated:</span>
              <span className="text-brand-cyan font-semibold">{reserveData?.delineated_area_km2 ?? 2.14} km²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Clay / Fe Ratio:</span>
              <span className="text-brand-gold">
                {reserveData?.spectral_diagnostics.mean_clay_index.toFixed(2)} / {reserveData?.spectral_diagnostics.mean_ferrous_index.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Drill Hole Detail Popup (Bottom-Left) */}
        {selectedTarget && (
          <div className="absolute bottom-3 left-3 z-[400] bg-surface-card/95 backdrop-blur-md border border-brand-gold/70 rounded-xl p-3.5 shadow-2xl max-w-sm text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-brand-gold font-bold border-b border-border-subtle pb-1.5">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-brand-gold" />
                <span>DRILL TARGET: {selectedTarget.target_id}</span>
              </span>
              <button onClick={() => setSelectedTarget(null)} className="p-1 text-text-secondary hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 space-y-1 text-text-primary">
              <div className="flex justify-between">
                <span className="text-text-secondary">Coordinates:</span>
                <span>{selectedTarget.lat}°N, {selectedTarget.lng}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Target Core Depth:</span>
                <span className="text-brand-cyan font-bold">{selectedTarget.target_depth_m} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Estimated Grade:</span>
                <span className="text-brand-sand font-bold">{selectedTarget.estimated_target_grade_pct}% Mn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Prospectivity Confidence:</span>
                <span className="text-brand-gold font-bold">{(selectedTarget.anomaly_probability * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Heatmap Legend (Bottom-Right) */}
        <div className="absolute bottom-3 right-12 z-[400] bg-canvas-dark/90 backdrop-blur-md border border-border-subtle rounded-lg px-3 py-1.5 shadow-xl text-[10px] font-mono flex items-center gap-2.5">
          <span className="text-text-secondary uppercase">Mn Anomaly:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#218DAE]" title="Low Anomaly (45-55%)" />
            <span className="w-3 h-3 rounded-sm bg-[#2BBBD7]" title="Moderate Alteration (55-70%)" />
            <span className="w-3 h-3 rounded-sm bg-[#FCE59A]" title="High Grade Gossan (70-80%)" />
            <span className="w-3 h-3 rounded-sm bg-[#FFD758]" title="Peak Manganese Deposit (>80%)" />
          </div>
          <span className="text-brand-gold font-bold">&gt;44% Mn</span>
        </div>

      </div>

    </div>
  );
};
