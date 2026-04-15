import type { Leader } from '../types';

export const LEADERS: Leader[] = [
  { id: 'aarti',   name: 'Aarti',   initials: 'AA' },
  { id: 'joshua',  name: 'Joshua',  initials: 'JO' },
  { id: 'rao',     name: 'Rao',     initials: 'RA' },
  { id: 'edmund',  name: 'Edmund',  initials: 'ED' },
  { id: 'arjun',   name: 'Arjun',   initials: 'AR' },
];

export function getLeader(id: string): Leader | undefined {
  return LEADERS.find(l => l.id === id);
}
