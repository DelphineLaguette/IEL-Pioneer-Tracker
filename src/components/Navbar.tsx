import { Link, useLocation } from 'react-router-dom';

const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav style={{ backgroundColor: IBL_NAVY }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
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

        <Link to="/" className="flex items-center gap-2.5 select-none">
          {/* Logo */}
          <img
            src="https://i.imgur.com/eaBRYQP.png"
            alt="IBL Energy"
            className="h-56 w-auto object-contain flex-shrink-0"
          />
          <div className="leading-none">
            <p className="font-bold text-white text-sm tracking-tight">Pioneer Tracker</p>
            <p className="text-xs mt-0.5" style={{ color: IBL_CYAN, opacity: 0.8 }}>
              IBL Energy · Leadership Development
            </p>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Admin link */}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Admin
        </Link>
      </div>

      {/* Cyan accent line */}
      <div className="h-0.5 w-full" style={{ backgroundColor: IBL_CYAN, opacity: 0.6 }} />
    </nav>
  );
}
