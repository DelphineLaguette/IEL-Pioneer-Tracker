export type UserRole = 'admin' | 'leader';

export interface AppUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  leaderId?: string; // only for leaders
}

const USERS_KEY = 'iel-pioneer-users';

// ── Update emails / passwords here to match real IBL Energy addresses ─────────
export const DEFAULT_USERS: AppUser[] = [
  // Admins (coaches) — real credentials
  { email: 'delphine.laguette@ibl-energy.com', password: 'EnergyDelphine!', role: 'admin',  name: 'Delphine Laguette' },
  { email: 'louise.desvaux@ibl-energy.com',    password: 'EnergyLouise!',   role: 'admin',  name: 'Louise Desvaux' },
  // Leaders — update emails for Aarti, Rao, Arjun
  { email: 'aarti@ibl-energy.com',             password: 'Pioneer2025!', role: 'leader', name: 'Aarti',   leaderId: 'aarti'   },
  { email: 'joshua.desjardins@ibl-energy.com', password: 'Pioneer2025!', role: 'leader', name: 'Joshua',  leaderId: 'joshua'  },
  { email: 'rao@ibl-energy.com',               password: 'Pioneer2025!', role: 'leader', name: 'Rao',     leaderId: 'rao'     },
  { email: 'edmund.njagi@ibl-energy.com',      password: 'Pioneer2025!', role: 'leader', name: 'Edmund',  leaderId: 'edmund'  },
  { email: 'arjun@ibl-energy.com',             password: 'Pioneer2025!', role: 'leader', name: 'Arjun',   leaderId: 'arjun'   },
];

export function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw) as AppUser[];
  } catch {
    return DEFAULT_USERS;
  }
}

export function findUser(email: string, password: string): AppUser | null {
  const users = loadUsers();
  return (
    users.find(
      u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    ) ?? null
  );
}

export function getLeaderEmail(
  leaderId: string,
  startingPointEmail?: string,
): string {
  if (startingPointEmail) return startingPointEmail;
  const users = loadUsers();
  return users.find(u => u.leaderId === leaderId)?.email ?? '';
}
