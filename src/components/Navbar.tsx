import { Link, useLocation } from 'react-router-dom';

const IBL_NAVY = '#002060';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
        {!isHome && (
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: IBL_NAVY }}
          >
            <span className="text-white font-bold text-xs">IEL</span>
          </div>
          <div>
            <p className="font-semibold leading-none" style={{ color: IBL_NAVY }}>Pioneer Tracker</p>
            <p className="text-xs text-gray-400 mt-0.5">Leadership Development Journey</p>
          </div>
        </Link>
      </div>
    </nav>
  );
}
