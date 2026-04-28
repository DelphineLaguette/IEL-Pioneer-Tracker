import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppUser } from '../data/users';
import { findUser } from '../data/users';

const SESSION_KEY        = 'iel-pioneer-session';
const SESSION_EXPIRY_KEY = 'iel-pioneer-session-expiry';
const SESSION_DAYS       = 30;

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadSession(): AppUser | null {
  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      return null;
    }
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(loadSession);

  function login(email: string, password: string): boolean {
    const found = findUser(email, password);
    if (!found) return false;
    setUser(found);
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    localStorage.setItem(
      SESSION_EXPIRY_KEY,
      String(Date.now() + SESSION_DAYS * 86_400_000),
    );
    return true;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
