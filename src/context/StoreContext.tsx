import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { TrackerData, StartingPoint, CheckIn } from '../types';

const STORAGE_KEY = 'iel-pioneer-tracker';

const defaultData: TrackerData = {
  startingPoints: [],
  checkIns: [],
};

function loadData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackerData) : defaultData;
  } catch {
    return defaultData;
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
