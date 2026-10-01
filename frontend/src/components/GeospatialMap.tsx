'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ReserveGridResponse, SectorInfo } from '@/lib/api';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Compass, Maximize2, Sparkles, Crosshair, Shield, X, Moon, Satellite } from 'lucide-react';

interface GeospatialMapProps {
  currentSector: SectorInfo;
  reserveData?: ReserveGridResponse | null;
  isLoading?: boolean;
}

type Basemap = 'dark' | 'satellite';

const BASEMAPS: Record<Basemap, { url: string; className: string; attribution: string; subdomains?: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    className: 'map-tiles-dark-theme',
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    className: 'map-tiles-satellite',
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  },
};

// Prospectivity colour ramp: probability -> RGBA. Shared by the raster and the legend.
const RAMP: [number, [number, number, number, number]][] = [
  [0.4, [96, 108, 56, 0]],
  [0.5, [96, 108, 56, 78]],
  [0.6, [138, 154, 82, 130]],
  [0.7, [221, 161, 94, 175]],
  [0.8, [226, 112, 58, 212]],
  [0.92, [254, 236, 190, 240]],
];

const rampColor = (p: number): [number, number, number, number] => {
  if (p <= RAMP[0][0]) return [0, 0, 0, 0];
  for (let i = 1; i < RAMP.length; i++) {
    if (p <= RAMP[i][0]) {
      const [p0, c0] = RAMP[i - 1];
      const [p1, c1] = RAMP[i];
      const t = (p - p0) / (p1 - p0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t, c0[3] + (c1[3] - c0[3]) * t];
    }
  }
  return RAMP[RAMP.length - 1][1];
};

const sampleGrid = (grid: number[][], u: number, v: number): number => {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (!rows || !cols) return 0;
  const gx = Math.max(0, Math.min(cols - 1, u * (cols - 1)));
  const gy = Math.max(0, Math.min(rows - 1, v * (rows - 1)));
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(cols - 1, x0 + 1);
  const y1 = Math.min(rows - 1, y0 + 1);
  // Smoothstep easing removes the faceted look of plain bilinear interpolation.
  const tx0 = gx - x0;
  const ty0 = gy - y0;
  const tx = tx0 * tx0 * (3 - 2 * tx0);
  const ty = ty0 * ty0 * (3 - 2 * ty0);
  const top = grid[y0][x0] * (1 - tx) + grid[y0][x1] * tx;
  const bot = grid[y1][x0] * (1 - tx) + grid[y1][x1] * tx;
  return top * (1 - ty) + bot * ty;
};

/** One pass of a 3x3 weighted blur so ridges in the coarse grid do not render as stair-steps. */
const blurGrid = (grid: number[][]): number[][] => {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const k = [1, 2, 1];
  return grid.map((row, r) =>
    row.map((_, c) => {
      let sum = 0;
      let wsum = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
          const w = k[dr + 1] * k[dc + 1];
          sum += grid[rr][cc] * w;
          wsum += w;
        }
      }
      return sum / wsum;
    }),
  );
};

/** Renders the probability grid as one smoothly interpolated raster instead of hard-edged cells. */
const buildHeatRaster = (rawGrid: number[][], size = 512): string => {
  const grid = blurGrid(rawGrid);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = sampleGrid(grid, x / (size - 1), y / (size - 1));
      const [r, g, b, a] = rampColor(p);
      const o = (y * size + x) * 4;
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
};

const toggleClass = (on: boolean) =>
  `flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium border transition-all duration-300 ${
    on ? 'bg-brand-caramel/[0.12] border-brand-caramel/45 text-brand-caramel' : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:text-text-primary hover:border-white/20'
  }`;

export const GeospatialMap: React.FC<GeospatialMapProps> = ({ currentSector, reserveData, isLoading = false }) => {
  const { motionEnabled } = useMotionPreference();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const firstFitRef = useRef<boolean>(true);
  const dataRef = useRef<ReserveGridResponse | null | undefined>(reserveData);
  const sectorRef = useRef<SectorInfo>(currentSector);
  dataRef.current = reserveData;
  sectorRef.current = currentSector;

  const [mapReady, setMapReady] = useState<boolean>(false);
  const [basemap, setBasemap] = useState<Basemap>('dark');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showDrillHoles, setShowDrillHoles] = useState<boolean>(true);
  const [showLeaseBoundary, setShowLeaseBoundary] = useState<boolean>(true);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);

  const dataMatchesSector = !!reserveData && reserveData.sector === currentSector.id;

  // 1. Create the map once.
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isMounted = true;

    (async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;
      LRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: sectorRef.current.centroid || [21.825, 80.175],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.25,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Live cursor readout (written straight to the DOM to avoid re-rendering on every mouse move).
      map.on('mousemove', (e: any) => {
        const el = readoutRef.current;
        if (!el) return;
        const data = dataRef.current;
        const sector = sectorRef.current;
        const bbox = data?.bbox || sector.bbox;
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(4)}°N  ${lng.toFixed(4)}°E`;
        const u = (lng - minLon) / (maxLon - minLon);
        const v = (maxLat - lat) / (maxLat - minLat);
        if (data?.probability_grid && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
          const p = sampleGrid(data.probability_grid, u, v);
          el.textContent = `${coords}   Mn prospectivity ${(p * 100).toFixed(1)}%`;
        } else {
          el.textContent = `${coords}   outside lease`;
        }
      });
      map.on('mouseout', () => {
        if (readoutRef.current) readoutRef.current.textContent = 'Hover the map to sample prospectivity';
      });

      setMapReady(true);
    })();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerGroupRef.current = null;
      tileRef.current = null;
      firstFitRef.current = true;
      setMapReady(false);
    };
  }, []);

  // 2. Basemap
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const cfg = BASEMAPS[basemap];
    const layer = L.tileLayer(cfg.url, { maxZoom: 19, className: cfg.className, subdomains: cfg.subdomains || 'abc' });
    layer.addTo(map);
    layer.bringToBack();
    tileRef.current = layer;
  }, [mapReady, basemap]);

  // 3. Move to the selected sector.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const [minLon, minLat, maxLon, maxLat] = currentSector.bbox;
    const bounds: [[number, number], [number, number]] = [[minLat, minLon], [maxLat, maxLon]];
    layerGroupRef.current?.clearLayers();
    setSelectedTarget(null);
    if (firstFitRef.current || !motionEnabled) {
      map.fitBounds(bounds, { padding: [24, 24], animate: false });
      firstFitRef.current = false;
    } else {
      map.flyToBounds(bounds, { padding: [24, 24], duration: 1.6, easeLinearity: 0.2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, currentSector.id]);

  // 4. Overlays
  useEffect(() => {
    const L = LRef.current;
    const group = layerGroupRef.current;
    if (!mapReady || !L || !group) return;
    group.clearLayers();

    const [minLon, minLat, maxLon, maxLat] = currentSector.bbox;

    if (showLeaseBoundary) {
      const poly = L.polygon(
        [[minLat, minLon], [maxLat, minLon], [maxLat, maxLon], [minLat, maxLon]],
        { color: '#dda15e', weight: 1.2, dashArray: '2 7', lineCap: 'round', fillColor: '#dda15e', fillOpacity: 0.035 },
      );
      poly.bindTooltip(`<b>MOIL mining lease</b><br/>${currentSector.name}`, { className: 'moil-tooltip', sticky: true });
      group.addLayer(poly);
    }

    if (dataMatchesSector && showHeatmap && reserveData?.probability_grid?.length) {
      const [bMinLon, bMinLat, bMaxLon, bMaxLat] = reserveData.bbox || currentSector.bbox;
      const url = buildHeatRaster(reserveData.probability_grid);
      if (url) {
        group.addLayer(L.imageOverlay(url, [[bMinLat, bMinLon], [bMaxLat, bMaxLon]], { opacity: 1, interactive: false, className: 'heat-raster' }));
      }
    }

    if (dataMatchesSector && showDrillHoles && reserveData?.drill_hole_targets) {
      reserveData.drill_hole_targets.forEach((target) => {
        const icon = L.divIcon({
          className: '',
          html: `<div class="drill-marker ${target.priority === 'HIGH' ? 'high' : ''}"><span class="pulse"></span><span class="core"></span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([target.lat, target.lng], { icon });
        marker.on('click', () => setSelectedTarget(target));
        marker.bindTooltip(`<b>${target.target_id}</b><br/>Target ${target.estimated_target_grade_pct}% Mn`, { className: 'moil-tooltip', direction: 'top', offset: [0, -10] });
        group.addLayer(marker);
      });
    }
  }, [mapReady, reserveData, dataMatchesSector, currentSector.id, showHeatmap, showDrillHoles, showLeaseBoundary]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const [minLon, minLat, maxLon, maxLat] = currentSector.bbox;
    map.flyToBounds([[minLat, minLon], [maxLat, maxLon]], { padding: [24, 24], duration: motionEnabled ? 1 : 0 });
  };

  const legendGradient = `linear-gradient(90deg, rgba(96,108,56,0.15) 0%, rgb(96,108,56) 18%, rgb(138,154,82) 40%, rgb(221,161,94) 62%, rgb(226,112,58) 82%, rgb(254,236,190) 100%)`;

  return (
    <Panel delay={0.3} spotlight={false} className="p-5 flex flex-col w-full overflow-hidden">
      <PanelHeader
        eyebrow="10-channel U-Net"
        title="Geospatial Mineral Prospectivity"
        subtitle="Sentinel-2 multispectral anomaly zones and target core exploration sites"
        icon={<Compass className="w-4 h-4" />}
        right={
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setShowHeatmap(!showHeatmap)} aria-pressed={showHeatmap} className={toggleClass(showHeatmap)}>
              <Sparkles className="w-3.5 h-3.5" />
              Heatmap
            </button>
            <button onClick={() => setShowDrillHoles(!showDrillHoles)} aria-pressed={showDrillHoles} className={toggleClass(showDrillHoles)}>
              <Crosshair className="w-3.5 h-3.5" />
              Drill holes
            </button>
            <button onClick={() => setShowLeaseBoundary(!showLeaseBoundary)} aria-pressed={showLeaseBoundary} className={toggleClass(showLeaseBoundary)}>
              <Shield className="w-3.5 h-3.5" />
              Lease
            </button>
            <button onClick={handleRecenter} title="Recenter to sector" aria-label="Recenter map to sector" className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-brand-caramel">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      <div className="relative w-full h-[440px] lg:h-[520px] rounded-2xl overflow-hidden mt-4 border border-white/[0.08] bg-ink-900">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Scan sweep when a sector loads */}
        <div key={currentSector.id} className="map-scan" aria-hidden />

        {/* Edge vignette so overlays sit comfortably on bright imagery */}
        <div className="pointer-events-none absolute inset-0 z-[380] shadow-[inset_0_0_80px_rgba(8,9,6,0.75)]" />

        {/* HUD: top-left */}
        <div className="absolute top-3 left-3 z-[400] hidden sm:block w-[236px] max-w-[calc(100%-1.5rem)] rounded-2xl bg-ink-900/80 backdrop-blur-xl border border-white/10 p-3.5 shadow-2xl">
          <div className="flex items-center justify-between mb-2.5">
            <span className="eyebrow text-brand-caramel">Sector HUD</span>
            <span className="font-mono text-[9.5px] text-text-muted truncate max-w-[110px]">{currentSector.id}</span>
          </div>
          <dl className="space-y-1.5 text-[11.5px]">
            {[
              ['Center', `${currentSector.centroid[0].toFixed(3)}°N, ${currentSector.centroid[1].toFixed(3)}°E`, 'text-text-primary'],
              ['Formation', reserveData?.geological_formation || 'Sausar Group', 'text-brand-cornsilk'],
              ['Delineated', `${reserveData?.delineated_area_km2 ?? 2.14} km²`, 'text-brand-caramel'],
              [
                'Clay / Fe',
                reserveData ? `${reserveData.spectral_diagnostics.mean_clay_index.toFixed(2)} / ${reserveData.spectral_diagnostics.mean_ferrous_index.toFixed(2)}` : '—',
                'text-brand-ember',
              ],
            ].map(([k, v, tone]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-text-muted">{k}</dt>
                <dd className={`font-mono text-right truncate ${tone}`} title={String(v)}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Basemap switch: top-right */}
        <div className="absolute top-3 right-3 z-[400] flex p-1 rounded-xl bg-ink-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          {(['dark', 'satellite'] as Basemap[]).map((b) => (
            <button
              key={b}
              onClick={() => setBasemap(b)}
              aria-pressed={basemap === b}
              className={`relative flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11.5px] font-medium capitalize transition-colors ${basemap === b ? 'text-ink-900' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {basemap === b && <motion.span layoutId="basemap-pill" className="absolute inset-0 rounded-lg bg-brand-caramel" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative flex items-center gap-1.5">
                {b === 'dark' ? <Moon className="w-3 h-3" /> : <Satellite className="w-3 h-3" />}
                {b}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom-left: drill-hole detail or cursor readout */}
        <div className="absolute bottom-3 left-3 z-[400] max-w-[calc(100%-6rem)]">
          <AnimatePresence mode="wait">
            {selectedTarget ? (
              <motion.div
                key="target"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="w-[280px] max-w-full rounded-2xl bg-ink-900/90 backdrop-blur-xl border border-brand-ember/50 p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[11px] text-brand-ember tracking-wider">
                    <Crosshair className="w-3.5 h-3.5" />
                    {selectedTarget.target_id}
                  </span>
                  <button onClick={() => setSelectedTarget(null)} aria-label="Close drill target" className="p-1 -m-1 text-text-muted hover:text-text-primary transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="numeral text-[30px] leading-none mt-3 text-text-primary">
                  {selectedTarget.estimated_target_grade_pct}
                  <span className="text-lg text-brand-caramel">% Mn</span>
                </div>
                <dl className="mt-3 pt-3 border-t border-white/[0.08] space-y-1.5 text-[11.5px]">
                  <div className="flex justify-between"><dt className="text-text-muted">Coordinates</dt><dd className="font-mono text-text-primary">{selectedTarget.lat}°N, {selectedTarget.lng}°E</dd></div>
                  <div className="flex justify-between"><dt className="text-text-muted">Core depth</dt><dd className="font-mono text-brand-caramel">{selectedTarget.target_depth_m} m</dd></div>
                  <div className="flex justify-between"><dt className="text-text-muted">Confidence</dt><dd className="font-mono text-brand-ember">{(selectedTarget.anomaly_probability * 100).toFixed(1)}%</dd></div>
                </dl>
              </motion.div>
            ) : (
              <motion.div key="readout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hidden sm:block rounded-xl bg-ink-900/80 backdrop-blur-xl border border-white/10 px-3 py-2 shadow-2xl">
                <span ref={readoutRef} className="font-mono text-[10.5px] text-text-secondary whitespace-pre">
                  Hover the map to sample prospectivity
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend: bottom-right, left of zoom */}
        <div className="absolute bottom-3 right-16 z-[400] hidden sm:block rounded-xl bg-ink-900/80 backdrop-blur-xl border border-white/10 px-3.5 py-2.5 shadow-2xl w-[244px]">
          <div className="flex justify-between gap-3 eyebrow mb-1.5">
            <span className="whitespace-nowrap"><span className="normal-case">Mn</span> prospectivity</span>
            <span className="text-brand-caramel whitespace-nowrap">&gt; 44% <span className="normal-case">Mn</span></span>
          </div>
          <div className="h-2 rounded-full" style={{ background: legendGradient }} />
          <div className="flex justify-between font-mono text-[9.5px] text-text-muted mt-1">
            <span>45%</span>
            <span>70%</span>
            <span>&gt; 90%</span>
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute bottom-0.5 right-1.5 z-[400] font-mono text-[8.5px] text-white/35 pointer-events-none">{BASEMAPS[basemap].attribution}</div>

        {/* Loading veil */}
        <AnimatePresence>
          {(isLoading || !dataMatchesSector) && (
            <motion.div
              key="veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-[420] pointer-events-none flex items-end justify-center pb-6 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent"
            >
              <span className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-ink-900/90 border border-white/10 font-mono text-[11px] text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-caramel animate-pulse" />
                Acquiring Sentinel-2 scene
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
};
