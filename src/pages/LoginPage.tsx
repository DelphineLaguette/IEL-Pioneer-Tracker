import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

const IBL_NAVY = '#002060';
const IBL_CYAN = '#00D0DA';
const IBL_PINK = '#FF51A1';

export default function LoginPage() {
  const { login }                   = useAuth();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = login(email.trim(), password);
    if (!ok) {
      setError('Email or password incorrect. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 55%, #002e80 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute rounded-full opacity-10 pointer-events-none"
        style={{ width: 500, height: 500, backgroundColor: IBL_CYAN, top: -150, right: -150 }}
      />
      <div
        className="absolute rounded-full opacity-10 pointer-events-none"
        style={{ width: 220, height: 220, backgroundColor: IBL_PINK, bottom: -60, left: 80 }}
      />
      <div
        className="absolute rounded-full opacity-5 pointer-events-none"
        style={{ width: 300, height: 300, backgroundColor: IBL_CYAN, bottom: 40, right: 200 }}
      />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-extrabold
                        text-xl mb-4 shadow-xl"
            style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
          >
            IEL
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Pioneer Tracker
          </h1>
          <p className="text-sm text-white/60 mt-1">IBL Energy · Leadership Development</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <p className="text-xs font-semibold text-center text-gray-400 uppercase tracking-widest mb-6">
                Sign in to your account
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your.email@ibl-energy.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent
                           transition-all placeholder-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm pr-11
                             focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent
                             transition-all placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                             transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-sm font-medium rounded-xl p-3 text-center"
                style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all
                         hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-lg"
              style={{ backgroundColor: IBL_NAVY }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          IBL Energy · IEL Pioneer Programme · 2025
        </p>
      </div>
    </div>
  );
}
