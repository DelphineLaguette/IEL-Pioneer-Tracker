import { Link, useLocation } from 'react-router-dom';

const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav style={{ backgroundColor: IBL_NAVY }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
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
          {/* Logo mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-extrabold text-xs tracking-tight"
            style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
          >
            IEL
          </div>
          <div className="leading-none">
            <p className="font-bold text-white text-sm tracking-tight">Pioneer Tracker</p>
            <p className="text-xs mt-0.5" style={{ color: IBL_CYAN, opacity: 0.8 }}>
              IBL Energy · Leadership Development
            </p>
          </div>
        </Link>
      </div>

      {/* Cyan accent line */}
      <div className="h-0.5 w-full" style={{ backgroundColor: IBL_CYAN, opacity: 0.6 }} />
    </nav>
  );
}
