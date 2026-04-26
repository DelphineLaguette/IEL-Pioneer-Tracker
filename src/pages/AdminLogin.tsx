import { useState, FormEvent } from 'react';

const IBL_NAVY = '#002060';
const IBL_CYAN = '#00D0DA';

const CREDENTIALS = [
  { email: 'delphine.laguette@ib-energy.com', password: 'EnergyDelphine!' },
  { email: 'louise.desvaux@ibl-energy.com',   password: 'EnergyLouise!'   },
];

const AUTH_KEY = 'iel-admin-auth';

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function adminLogout(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const match = CREDENTIALS.find(
      c => c.email === email.trim().toLowerCase() && c.password === password
    );
    if (match) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      onSuccess();
    } else {
      setError('Incorrect email or password.');
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 100%)` }}
        >
          <div className="p-8">
            <img
              src="https://i.imgur.com/eaBRYQP.png"
              alt="IBL Energy"
              style={{ height: '60px', width: 'auto', objectFit: 'contain', marginBottom: '1.5rem' }}
            />
            <h1 className="text-xl font-extrabold text-white mb-1">Admin Access</h1>
            <p className="text-sm mb-6" style={{ color: IBL_CYAN, opacity: 0.8 }}>
              Pioneer Tracker · IBL Energy
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                  className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white
                             border border-white/20 placeholder-white/30
                             focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': IBL_CYAN } as React.CSSProperties}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  className="w-full rounded-lg px-3 py-2.5 text-sm bg-white/10 text-white
                             border border-white/20 placeholder-white/30
                             focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': IBL_CYAN } as React.CSSProperties}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-xs font-medium" style={{ color: '#FF51A1' }}>{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
