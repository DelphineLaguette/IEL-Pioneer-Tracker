import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { TrackerData, StartingPoint, CheckIn, BiWeeklyCheckIn } from '../types';
import { SEED_STARTING_POINTS, SEED_BI_WEEKLY_CHECK_INS } from '../data/seedData';

const STORAGE_KEY = 'iel-pioneer-tracker';

const defaultData: TrackerData = {
  startingPoints: [],
  checkIns: [],
  biWeeklyCheckIns: [],
};

export function getLatestSP(
  startingPoints: StartingPoint[],
  leaderId: string,
): StartingPoint | undefined {
  return [...startingPoints]
    .filter(s => s.leaderId === leaderId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
}

export function getAllSPs(
  startingPoints: StartingPoint[],
  leaderId: string,
): StartingPoint[] {
  return [...startingPoints]
    .filter(s => s.leaderId === leaderId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

function mergeSeeds(stored: TrackerData): TrackerData {
  const existingSpIds = new Set(stored.startingPoints.map(s => s.leaderId));
  const spToAdd = SEED_STARTING_POINTS.filter(s => !existingSpIds.has(s.leaderId));

  const existingBwIds = new Set(stored.biWeeklyCheckIns.map(b => b.id));
  const bwToAdd = SEED_BI_WEEKLY_CHECK_INS.filter(b => !existingBwIds.has(b.id));

  if (spToAdd.length === 0 && bwToAdd.length === 0) return stored;
  return {
    ...stored,
    startingPoints: [...stored.startingPoints, ...spToAdd],
    biWeeklyCheckIns: [...stored.biWeeklyCheckIns, ...bwToAdd],
  };
}

function persist(data: TrackerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as TrackerData) : defaultData;
    // Migrate: ensure new arrays exist for data saved before these features
    if (!stored.biWeeklyCheckIns) stored.biWeeklyCheckIns = [];
    return mergeSeeds(stored);
  } catch {
    return mergeSeeds(defaultData);
  }
}

interface StoreContextType {
  data: TrackerData;
  saveStartingPoint: (sp: StartingPoint) => void;
  addCheckIn: (ci: CheckIn) => void;
  addBiWeeklyCheckIn: (bw: BiWeeklyCheckIn) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrackerData>(loadData);

  const saveStartingPoint = useCallback((sp: StartingPoint) => {
    setData(prev => {
      const next: TrackerData = { ...prev, startingPoints: [...prev.startingPoints, sp] };
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

  const addBiWeeklyCheckIn = useCallback((bw: BiWeeklyCheckIn) => {
    setData(prev => {
      const next: TrackerData = { ...prev, biWeeklyCheckIns: [...prev.biWeeklyCheckIns, bw] };
      persist(next);
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{ data, saveStartingPoint, addCheckIn, addBiWeeklyCheckIn }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
