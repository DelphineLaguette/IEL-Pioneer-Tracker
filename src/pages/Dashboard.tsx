import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LEADERS } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import type { StartingPoint, PrincipleKey } from '../types';

// IBL Energy brand colors
const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';
const IBL_PINK  = '#FF51A1';

const RATING_COLORS = [
  '',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-yellow-100 text-yellow-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
];

function PrinciplePill({ sp, principleKey, label }: { sp: StartingPoint; principleKey: PrincipleKey; label: string }) {
  const rating = sp[principleKey]?.rating ?? 0;
  const colorClass = RATING_COLORS[rating] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
      {label} <span className="font-bold">{rating}/5</span>
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { data } = useStore();

  const completedCount = LEADERS.filter(l =>
    data.startingPoints.some(sp => sp.leaderId === l.id)
  ).length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: IBL_NAVY }}>
          Leadership Development Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Tracking the pioneering journeys of our IEL leaders</p>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <span className="text-gray-600">
            <span className="font-semibold" style={{ color: IBL_NAVY }}>{completedCount}</span> of {LEADERS.length} leaders started
          </span>
          <span className="text-gray-600">
            <span className="font-semibold" style={{ color: IBL_NAVY }}>{data.checkIns.length}</span> total check-ins submitted
          </span>
        </div>
      </div>

      {/* Scale legend */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Self-Rating Scale</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { n: 1, label: 'Rarely true of me today' },
            { n: 2, label: 'Sometimes true, but inconsistent' },
            { n: 3, label: 'Often true in my leadership' },
            { n: 4, label: 'Strongly present and visible' },
            { n: 5, label: 'A clear strength, consistently demonstrated' },
          ].map(({ n, label }) => (
            <span key={n} className={`px-2 py-1 rounded-full font-medium ${RATING_COLORS[n]}`}>
              {n} — {label}
            </span>
          ))}
        </div>
      </div>

      {/* Leader cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {LEADERS.map(leader => {
          const sp = data.startingPoints.find(s => s.leaderId === leader.id);
          const checkIns = data.checkIns.filter(c => c.leaderId === leader.id);

          return (
            <div
              key={leader.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* IBL Navy stripe */}
              <div className="h-1.5" style={{ backgroundColor: IBL_NAVY }} />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: IBL_NAVY }}
                  >
                    {leader.initials}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900">{leader.name}</h2>
                    {sp ? (
                      <p className="text-xs text-gray-400 truncate">{sp.team}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Not yet started</p>
                    )}
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    {sp ? (
                      <span
                        className="px-2 py-0.5 text-white text-xs font-medium rounded-full"
                        style={{ backgroundColor: IBL_CYAN }}
                      >
                        Started
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Principle ratings */}
                {sp && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Principle Ratings
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRINCIPLES.map(p => (
                        <PrinciplePill
                          key={p.id}
                          sp={sp}
                          principleKey={p.id}
                          label={`P${p.number}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>
                    <span className="font-semibold text-gray-900">{checkIns.length}</span>{' '}
                    check-in{checkIns.length !== 1 ? 's' : ''}
                  </span>
                  {sp && (
                    <span className="text-xs text-gray-400">Since {formatDate(sp.submittedAt)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/leaders/${leader.id}`}
                    className="flex-1 text-center py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    View Journey
                  </Link>
                  {!sp ? (
                    <Link
                      to={`/leaders/${leader.id}/starting-point`}
                      className="flex-1 text-center py-2 px-3 text-white text-sm font-medium rounded-lg transition-colors"
                      style={{ backgroundColor: IBL_NAVY }}
                    >
                      Start Reflection
                    </Link>
                  ) : (
                    <Link
                      to={`/leaders/${leader.id}/checkin/new`}
                      className="flex-1 text-center py-2 px-3 text-white text-sm font-medium rounded-lg transition-colors"
                      style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
                    >
                      Add Check-In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
