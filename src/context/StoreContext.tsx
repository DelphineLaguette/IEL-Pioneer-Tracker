import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TrackerData, StartingPoint, CheckIn, BiWeeklyCheckIn } from '../types';
import { SEED_STARTING_POINTS, SEED_BI_WEEKLY_CHECK_INS } from '../data/seedData';
import {
  collection, doc, setDoc, onSnapshot, writeBatch,
} from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '../lib/firebase';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'iel-pioneer-tracker';

const defaultData: TrackerData = { startingPoints: [], checkIns: [], biWeeklyCheckIns: [] };

// ── localStorage helpers (fallback when Firebase not configured) ──────────────

function localLoad(): TrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as TrackerData) : defaultData;
    if (!stored.biWeeklyCheckIns) stored.biWeeklyCheckIns = [];
    return mergeLocalSeeds(stored);
  } catch {
    return mergeLocalSeeds(defaultData);
  }
}

function localSave(data: TrackerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function mergeLocalSeeds(stored: TrackerData): TrackerData {
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

// ── Firestore seed (runs once when collections are empty) ─────────────────────

async function seedFirestoreIfEmpty(existing: TrackerData): Promise<void> {
  const batch = writeBatch(db);
  let hasWrites = false;

  const existingSpIds = new Set(existing.startingPoints.map(s => s.leaderId));
  SEED_STARTING_POINTS.forEach(sp => {
    if (!existingSpIds.has(sp.leaderId)) {
      batch.set(doc(db, 'startingPoints', sp.id), sp);
      hasWrites = true;
    }
  });

  const existingBwIds = new Set(existing.biWeeklyCheckIns.map(b => b.id));
  SEED_BI_WEEKLY_CHECK_INS.forEach(bw => {
    if (!existingBwIds.has(bw.id)) {
      batch.set(doc(db, 'biWeeklyCheckIns', bw.id), bw);
      hasWrites = true;
    }
  });

  if (hasWrites) await batch.commit();
}

// ── Context ───────────────────────────────────────────────────────────────────

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

interface StoreContextType {
  data: TrackerData;
  saveStartingPoint: (sp: StartingPoint) => void;
  addCheckIn: (ci: CheckIn) => void;
  addBiWeeklyCheckIn: (bw: BiWeeklyCheckIn) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ── Loading screen (shown while Firestore loads) ──────────────────────────────

function LoadingScreen() {
  const IBL_NAVY = '#002060';
  const IBL_CYAN = '#00D0DA';
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 100%)` }}>
      <div className="text-center">
        <img src="https://i.imgur.com/eaBRYQP.png" alt="IBL Energy"
             style={{ height: '80px', width: 'auto', objectFit: 'contain', margin: '0 auto 1.5rem' }} />
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full animate-bounce"
               style={{ backgroundColor: IBL_CYAN, animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce"
               style={{ backgroundColor: IBL_CYAN, animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce"
               style={{ backgroundColor: IBL_CYAN, animationDelay: '300ms' }} />
        </div>
        <p className="text-white/60 text-sm mt-3">Loading Pioneer Tracker…</p>
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  if (!FIREBASE_CONFIGURED) {
    return <LocalStoreProvider>{children}</LocalStoreProvider>;
  }
  return <FirestoreProvider>{children}</FirestoreProvider>;
}

// ── localStorage provider (fallback) ─────────────────────────────────────────

function LocalStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrackerData>(localLoad);

  const saveStartingPoint = useCallback((sp: StartingPoint) => {
    setData(prev => {
      const next = { ...prev, startingPoints: [...prev.startingPoints, sp] };
      localSave(next);
      return next;
    });
  }, []);

  const addCheckIn = useCallback((ci: CheckIn) => {
    setData(prev => {
      const next = { ...prev, checkIns: [...prev.checkIns, ci] };
      localSave(next);
      return next;
    });
  }, []);

  const addBiWeeklyCheckIn = useCallback((bw: BiWeeklyCheckIn) => {
    setData(prev => {
      const next = { ...prev, biWeeklyCheckIns: [...prev.biWeeklyCheckIns, bw] };
      localSave(next);
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{ data, saveStartingPoint, addCheckIn, addBiWeeklyCheckIn }}>
      {children}
    </StoreContext.Provider>
  );
}

// ── Firestore provider ────────────────────────────────────────────────────────

function FirestoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrackerData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mutable accumulator updated by each listener; state is updated via setData
    const acc: TrackerData = { startingPoints: [], checkIns: [], biWeeklyCheckIns: [] };
    const ready = { sp: false, ci: false, bw: false };
    let seeded = false;

    function maybeFinishLoading() {
      if (ready.sp && ready.ci && ready.bw) {
        setLoading(false);
        if (!seeded) {
          seeded = true;
          seedFirestoreIfEmpty(acc).catch(console.error);
        }
      }
    }

    const unsubSP = onSnapshot(collection(db, 'startingPoints'), snap => {
      acc.startingPoints = snap.docs.map(d => d.data() as StartingPoint);
      ready.sp = true;
      setData({ ...acc });
      maybeFinishLoading();
    }, console.error);

    const unsubCI = onSnapshot(collection(db, 'checkIns'), snap => {
      acc.checkIns = snap.docs.map(d => d.data() as CheckIn);
      ready.ci = true;
      setData({ ...acc });
      maybeFinishLoading();
    }, console.error);

    const unsubBW = onSnapshot(collection(db, 'biWeeklyCheckIns'), snap => {
      acc.biWeeklyCheckIns = snap.docs.map(d => d.data() as BiWeeklyCheckIn);
      ready.bw = true;
      setData({ ...acc });
      maybeFinishLoading();
    }, console.error);

    return () => { unsubSP(); unsubCI(); unsubBW(); };
  }, []);

  const saveStartingPoint = useCallback((sp: StartingPoint) => {
    setDoc(doc(db, 'startingPoints', sp.id), sp).catch(console.error);
  }, []);

  const addCheckIn = useCallback((ci: CheckIn) => {
    setDoc(doc(db, 'checkIns', ci.id), ci).catch(console.error);
  }, []);

  const addBiWeeklyCheckIn = useCallback((bw: BiWeeklyCheckIn) => {
    setDoc(doc(db, 'biWeeklyCheckIns', bw.id), bw).catch(console.error);
  }, []);

  return (
    <StoreContext.Provider value={{ data, saveStartingPoint, addCheckIn, addBiWeeklyCheckIn }}>
      {loading ? <LoadingScreen /> : children}
    </StoreContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
