'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SECTORS_LIST, SectorInfo } from '@/lib/api';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { Satellite, Sliders, Clock, ChevronDown, Search, Wind, Pause, Check } from 'lucide-react';

interface NavbarProps {
  currentSector: SectorInfo;
  onSelectSector: (sector: SectorInfo) => void;
  onOpenSimulation: () => void;
  isBackendHealthy?: boolean;
}

/** Faceted ore-crystal mark drawn as contour rings. */
const BrandMark: React.FC = () => (
  <svg viewBox="0 0 40 40" className="w-9 h-9" aria-hidden>
    <defs>
      <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0c690" />
        <stop offset="100%" stopColor="#bc6c25" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="rgba(254,250,224,0.04)" stroke="rgba(254,250,224,0.14)" />
    <path d="M20 6.5 32 13.5v13L20 33.5 8 26.5v-13Z" fill="none" stroke="url(#bm)" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M20 12 27.5 16.3v7.4L20 28 12.5 23.7v-7.4Z" fill="none" stroke="#dda15e" strokeOpacity="0.7" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M20 17.2 23.2 19v2L20 22.8 16.8 21v-2Z" fill="url(#bm)" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ currentSector, onSelectSector, onOpenSimulation, isBackendHealthy = true }) => {
  const { motionEnabled, toggleMotion } = useMotionPreference();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [cursor, setCursor] = useState<number>(0);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(Math.max(0, SECTORS_LIST.findIndex((s) => s.id === currentSector.id)));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTORS_LIST;
    return SECTORS_LIST.filter((s) => `${s.name} ${s.state} ${s.primary_mineral}`.toLowerCase().includes(q));
  }, [query]);

  // Group by state, preserving the order of first appearance
  const grouped = useMemo(() => {
    const map = new Map<string, SectorInfo[]>();
    filtered.forEach((s) => {
      if (!map.has(s.state)) map.set(s.state, []);
      map.get(s.state)!.push(s);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Flat order matches visual order for keyboard navigation
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const choose = useCallback(
    (s: SectorInfo) => {
      onSelectSector(s);
      setOpen(false);
    },
    [onSelectSector],
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault();
      choose(flat[cursor]);
    }
  };

  let runningIdx = -1;

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-4 lg:px-6 pt-3">
      <div
        className={`max-w-[1720px] mx-auto rounded-[22px] border transition-all duration-500 ${
          scrolled ? 'bg-ink-900/80 border-white/[0.09] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]' : 'bg-ink-900/40 border-white/[0.06]'
        } backdrop-blur-2xl px-3.5 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <BrandMark />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-[19px] leading-none text-text-primary tracking-tight" style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 50" }}>
                MOIL Limited
              </span>
              <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-brand-caramel border border-brand-caramel/30 bg-brand-caramel/[0.07] px-1.5 py-[3px] rounded-md">
                SIH 2026
              </span>
            </div>
            <p className="hidden sm:block text-[11.5px] text-text-secondary mt-1 truncate">Manganese Reserve AI &amp; Mine Production Shortfall Prevention</p>
          </div>
        </div>

        {/* Sector picker */}
        <div ref={wrapRef} className="relative order-3 md:order-none w-full md:w-auto">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="btn-ghost w-full md:w-[340px] flex items-center gap-3 pl-3.5 pr-3 py-2 rounded-2xl text-left group"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand-caramel animate-ping-soft" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-caramel" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="eyebrow block leading-none mb-1">Mining sector</span>
              <span className="block text-[13px] font-medium text-text-primary truncate">{currentSector.name}</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${open ? 'rotate-180 text-brand-caramel' : ''}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-full left-0 mt-2 w-full md:w-[440px] origin-top rounded-2xl border border-white/10 bg-ink-800/95 backdrop-blur-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.95)] overflow-hidden z-50"
              >
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07]">
                  <Search className="w-4 h-4 text-text-muted" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    placeholder="Search belts, states or minerals"
                    aria-label="Search mining sectors"
                    className="flex-1 bg-transparent outline-none focus-visible:outline-none text-[13px] text-text-primary placeholder:text-text-muted"
                  />
                  <span className="font-mono text-[10px] text-text-muted border border-white/10 rounded px-1.5 py-0.5">
                    {filtered.length}/{SECTORS_LIST.length}
                  </span>
                </div>

                <div ref={listRef} role="listbox" className="max-h-[56vh] overflow-y-auto py-1.5">
                  {grouped.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-text-secondary">No belts match “{query}”.</div>}
                  {grouped.map(([state, items]) => (
                    <div key={state} className="pb-1">
                      <div className="eyebrow px-4 pt-3 pb-1.5">{state}</div>
                      {items.map((s) => {
                        runningIdx += 1;
                        const idx = runningIdx;
                        const active = idx === cursor;
                        const selected = s.id === currentSector.id;
                        return (
                          <button
                            key={s.id}
                            data-idx={idx}
                            role="option"
                            aria-selected={selected}
                            onMouseEnter={() => setCursor(idx)}
                            onClick={() => choose(s)}
                            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${active ? 'bg-white/[0.06]' : ''}`}
                          >
                            <span className={`w-4 flex justify-center ${selected ? 'text-brand-caramel' : 'text-transparent'}`}>
                              <Check className="w-3.5 h-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[13px] truncate ${selected ? 'text-brand-caramel' : 'text-text-primary'}`}>{s.name}</span>
                              <span className="block text-[11px] text-text-muted truncate">{s.primary_mineral}</span>
                            </span>
                            <span className="text-right shrink-0">
                              <span className="block font-mono text-[12px] text-brand-caramel tabular-nums">{s.avg_grade_pct}% Mn</span>
                              <span className="block font-mono text-[10.5px] text-text-muted tabular-nums">{s.est_reserves_mt} MT</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px]">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-text-secondary">
              <Satellite className="w-3.5 h-3.5 text-brand-caramel" />
              <span className="text-text-primary">Sentinel-2 L2A</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-text-secondary">
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-brand-moss shadow-[0_0_10px_#8a9a52]' : 'bg-brand-ember shadow-[0_0_10px_#e2703a]'}`} />
              AI core <span className={isBackendHealthy ? 'text-brand-moss' : 'text-brand-ember'}>{isBackendHealthy ? 'optimal' : 'standalone'}</span>
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-text-primary tabular-nums min-w-[118px] justify-center">
              <Clock className="w-3.5 h-3.5 text-brand-caramel" />
              {currentTime || '00:00:00 IST'}
            </span>
          </div>

          <button
            onClick={toggleMotion}
            aria-pressed={motionEnabled}
            title={motionEnabled ? 'Pause ambient motion' : 'Resume ambient motion'}
            className="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:text-brand-caramel"
          >
            {motionEnabled ? <Wind className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="sr-only">{motionEnabled ? 'Pause ambient motion' : 'Resume ambient motion'}</span>
          </button>

          <button onClick={onOpenSimulation} className="btn-primary flex items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold">
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Simulate What-If</span>
            <span className="sm:hidden">Simulate</span>
          </button>
        </div>
      </div>
    </header>
  );
};
