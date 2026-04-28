import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const IBL_NAVY = '#002060';
const IBL_CYAN = '#00D0DA';

export default function Navbar() {
  const location         = useLocation();
  const { user, logout } = useAuth();
  const isHome           = location.pathname === '/';
  const isAdmin          = user?.role === 'admin';

  return (
    <nav style={{ backgroundColor: IBL_NAVY }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">

        {/* Back arrow */}
        {!isHome && (
          <Link
            to="/"
            aria-label="Back to dashboard"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: IBL_CYAN }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <img
            src="https://i.imgur.com/eaBRYQP.png"
            alt="IBL Energy"
            style={{ height: '120px', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
          <p className="font-bold text-white text-sm tracking-tight">Pioneer Tracker</p>
        </Link>

        <div className="flex-1" />

        {/* Admin nav links — only for admins */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              to="/bi-weekly"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={
                location.pathname === '/bi-weekly'
                  ? { backgroundColor: IBL_CYAN, color: IBL_NAVY }
                  : { color: IBL_CYAN, border: `1px solid ${IBL_CYAN}33` }
              }
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bi-Weekly
            </Link>

            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={
                location.pathname === '/admin'
                  ? { backgroundColor: IBL_CYAN, color: IBL_NAVY }
                  : { color: IBL_CYAN, border: `1px solid ${IBL_CYAN}33` }
              }
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Admin
            </Link>
          </div>
        )}

        {/* User pill + logout */}
        {user && (
          <>
            <div className="h-6 w-px bg-white/20 mx-1" />
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end leading-none">
                <span className="text-xs font-semibold text-white">{user.name}</span>
                <span className="text-xs mt-0.5" style={{ color: IBL_CYAN, opacity: 0.7 }}>
                  {user.role === 'admin' ? 'Admin' : 'Leader'}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                           text-white/50 hover:text-white hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="h-0.5 w-full" style={{ backgroundColor: IBL_CYAN, opacity: 0.6 }} />
    </nav>
  );
}
