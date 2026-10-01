'use client';

import React, { useEffect, useRef } from 'react';
import { useMotionPreference } from '@/hooks/useMotionPreference';

/**
 * Living topographic background.
 *
 * A slowly evolving 3D noise field (x, y, time) is sampled on a coarse grid and traced into contour
 * lines with marching squares, the way a survey map draws elevation. Every fifth line is an "index
 * contour" (heavier, warmer), and a faint pointer parallax shifts the field as the mouse moves.
 *
 * It pauses when the tab is hidden, caps device pixel ratio, and renders a single still frame when
 * motion is turned off (OS reduced-motion or the navbar toggle).
 */

// ---- Perlin-style 3D gradient noise -------------------------------------------------------
const PERM = (() => {
  const p = new Uint8Array(512);
  const base = new Uint8Array(256);
  let seed = 1337;
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    const t = base[i];
    base[i] = base[j];
    base[j] = t;
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  return p;
})();

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const grad = (h: number, x: number, y: number, z: number) => {
  const hh = h & 15;
  const u = hh < 8 ? x : y;
  const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
  return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
};

function noise3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(PERM[AA], x, y, z), grad(PERM[BA], x - 1, y, z), u), lerp(grad(PERM[AB], x, y - 1, z), grad(PERM[BB], x - 1, y - 1, z), u), v),
    lerp(lerp(grad(PERM[AA + 1], x, y, z - 1), grad(PERM[BA + 1], x - 1, y, z - 1), u), lerp(grad(PERM[AB + 1], x, y - 1, z - 1), grad(PERM[BB + 1], x - 1, y - 1, z - 1), u), v),
    w,
  );
}

const field = (x: number, y: number, t: number) =>
  noise3(x, y, t) * 0.65 + noise3(x * 2.1 + 17.3, y * 2.1 - 4.1, t * 1.4) * 0.28 + noise3(x * 4.3 - 9.1, y * 4.3 + 22.7, t * 2) * 0.07;

const LEVELS = 21; // contour count
const INDEX_EVERY = 5;

export const TerrainBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionEnabled } = useMotionPreference();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let cell = 14;
    let values = new Float32Array(0);
    let raf = 0;
    let running = false;
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const startTime = performance.now();
    // Start the field at a visually interesting offset instead of t = 0.
    const T0 = 7.5;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = width < 700 ? 16 : 12;
      cols = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / cell) + 1;
      values = new Float32Array(cols * rows);
      if (!running) draw(T0);
    };

    const draw = (t: number) => {
      // Smooth the parallax target.
      pointer.sx += (pointer.x - pointer.sx) * 0.04;
      pointer.sy += (pointer.y - pointer.sy) * 0.04;

      const scale = 0.0034; // spatial frequency of the terrain
      const ox = pointer.sx * 0.22;
      const oy = pointer.sy * 0.22;

      // 1. Sample the field.
      let min = Infinity;
      let max = -Infinity;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const v = field((i * cell) * scale + ox, (j * cell) * scale + oy, t);
          values[j * cols + i] = v;
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 2. Trace each level with marching squares.
      const range = Math.max(1e-6, max - min);
      for (let L = 1; L <= LEVELS; L++) {
        const level = min + (range * L) / (LEVELS + 1);
        const isIndex = L % INDEX_EVERY === 0;
        const k = L / (LEVELS + 1); // 0..1 elevation
        // Low ground sits in olive; highs warm toward caramel.
        const r = Math.round(lerp(96, 221, k * k));
        const g = Math.round(lerp(108, 161, k * k));
        const b = Math.round(lerp(56, 94, k * k));
        ctx.strokeStyle = isIndex ? `rgba(${r},${g},${b},0.46)` : `rgba(${r},${g},${b},0.2)`;
        ctx.lineWidth = isIndex ? 1.25 : 0.7;
        ctx.beginPath();

        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = values[j * cols + i];
            const bb = values[j * cols + i + 1];
            const c = values[(j + 1) * cols + i + 1];
            const d = values[(j + 1) * cols + i];
            let idx = 0;
            if (a > level) idx |= 8;
            if (bb > level) idx |= 4;
            if (c > level) idx |= 2;
            if (d > level) idx |= 1;
            if (idx === 0 || idx === 15) continue;

            const x0 = i * cell;
            const y0 = j * cell;
            // Edge intersection points with linear interpolation.
            const top = () => [x0 + cell * ((level - a) / (bb - a)), y0] as const;
            const right = () => [x0 + cell, y0 + cell * ((level - bb) / (c - bb))] as const;
            const bottom = () => [x0 + cell * ((level - d) / (c - d)), y0 + cell] as const;
            const left = () => [x0, y0 + cell * ((level - a) / (d - a))] as const;

            const seg = (p: readonly [number, number], q: readonly [number, number]) => {
              ctx.moveTo(p[0], p[1]);
              ctx.lineTo(q[0], q[1]);
            };

            switch (idx) {
              case 1: case 14: seg(left(), bottom()); break;
              case 2: case 13: seg(bottom(), right()); break;
              case 3: case 12: seg(left(), right()); break;
              case 4: case 11: seg(top(), right()); break;
              case 5: seg(left(), top()); seg(bottom(), right()); break;
              case 6: case 9: seg(top(), bottom()); break;
              case 7: case 8: seg(left(), top()); break;
              case 10: seg(top(), right()); seg(left(), bottom()); break;
            }
          }
        }
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      // Very slow drift: one full "breath" of the terrain takes minutes.
      draw(T0 + ((now - startTime) / 1000) * 0.045);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / width - 0.5) * 2;
      pointer.y = (e.clientY / height - 0.5) * 2;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (motionEnabled) start();
    };

    resize();
    window.addEventListener('resize', resize);

    if (motionEnabled) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      start();
    } else {
      draw(T0);
    }

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [motionEnabled]);

  return (
    <>
      <div className="ambient-bloom" aria-hidden />
      <canvas ref={canvasRef} aria-hidden className="fixed inset-0 -z-20 pointer-events-none" />
      <div className="ambient-vignette" aria-hidden />
      <div className="ambient-grain" aria-hidden />
    </>
  );
};
