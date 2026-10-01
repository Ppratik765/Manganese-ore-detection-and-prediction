'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Ambient motion preference.
 * Starts from the OS-level `prefers-reduced-motion` setting, can be flipped by the user from the
 * navbar, and is remembered in localStorage so weak machines only need to opt out once.
 */
interface MotionPreference {
  /** True when ambient animation (background, count-ups, shimmer) should run. */
  motionEnabled: boolean;
  toggleMotion: () => void;
}

const STORAGE_KEY = 'moil-ambient-motion';

const MotionContext = createContext<MotionPreference>({
  motionEnabled: true,
  toggleMotion: () => {},
});

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [motionEnabled, setMotionEnabled] = useState<boolean>(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    if (stored === 'on') setMotionEnabled(true);
    else if (stored === 'off') setMotionEnabled(false);
    else setMotionEnabled(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
  }, [motionEnabled]);

  const toggleMotion = useCallback(() => {
    setMotionEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ motionEnabled, toggleMotion }), [motionEnabled, toggleMotion]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export const useMotionPreference = () => useContext(MotionContext);
