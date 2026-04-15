import type { Leader } from '../types';

export const LEADERS: Leader[] = [
  { id: 'aarti',   name: 'Aarti',   color: '#7C3AED', initials: 'AA' },
  { id: 'joshua',  name: 'Joshua',  color: '#2563EB', initials: 'JO' },
  { id: 'rao',     name: 'Rao',     color: '#0891B2', initials: 'RA' },
  { id: 'edmund',  name: 'Edmund',  color: '#059669', initials: 'ED' },
  { id: 'arjun',   name: 'Arjun',   color: '#D97706', initials: 'AR' },
];

export function getLeader(id: string): Leader | undefined {
  return LEADERS.find(l => l.id === id);
}
