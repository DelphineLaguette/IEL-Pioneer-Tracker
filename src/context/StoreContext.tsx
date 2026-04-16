import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { TrackerData, StartingPoint, CheckIn } from '../types';
import { SEED_STARTING_POINTS } from '../data/seedData';

const STORAGE_KEY = 'iel-pioneer-tracker';

const defaultData: TrackerData = {
  startingPoints: [],
  checkIns: [],
};

/**
 * Merge seed starting points into stored data.
 * Only adds a seed entry if no starting point already exists for that leaderId,
 * so hand-entered data is never overwritten.
 */
function mergeSeeds(stored: TrackerData): TrackerData {
  const existingIds = new Set(stored.startingPoints.map(s => s.leaderId));
  const toAdd = SEED_STARTING_POINTS.filter(s => !existingIds.has(s.leaderId));
  if (toAdd.length === 0) return stored;
  return { ...stored, startingPoints: [...stored.startingPoints, ...toAdd] };
}

function loadData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as TrackerData) : defaultData;
    return mergeSeeds(stored);
  } catch {
    return mergeSeeds(defaultData);
  }
}

function persist(data: TrackerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface StoreContextType {
  data: TrackerData;
  saveStartingPoint: (sp: StartingPoint) => void;
  addCheckIn: (ci: CheckIn) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrackerData>(loadData);

  const saveStartingPoint = useCallback((sp: StartingPoint) => {
    setData(prev => {
      const filtered = prev.startingPoints.filter(s => s.leaderId !== sp.leaderId);
      const next: TrackerData = { ...prev, startingPoints: [...filtered, sp] };
      persist(next);
      return next;
    });
  }, []);

  const addCheckIn = useCallback((ci: CheckIn) => {
    setData(prev => {
      const next: TrackerData = { ...prev, checkIns: [...prev.checkIns, ci] };
      persist(next);
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{ data, saveStartingPoint, addCheckIn }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
