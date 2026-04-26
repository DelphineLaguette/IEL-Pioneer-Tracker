import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LEADERS } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import type { StartingPoint, PrincipleKey } from '../types';

const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';
const IBL_PINK  = '#FF51A1';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Mini bar chart showing all 6 principle ratings
function PrincipleBars({ sp }: { sp: StartingPoint }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Principle Ratings
      </p>
      <div className="flex items-end gap-1 h-10">
        {PRINCIPLES.map(p => {
          const rating = sp[p.id as PrincipleKey]?.rating ?? 0;
          const pct    = (rating / 5) * 100;
          const bg     = rating >= 4 ? IBL_CYAN : rating === 3 ? '#60a5fa' : rating > 0 ? '#fbbf24' : '#e5e7eb';
          return (
            <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gray-100 rounded-sm h-8 flex items-end overflow-hidden">
                <div
                  className="w-full rounded-sm transition-all duration-500"
                  style={{ height: `${pct}%`, backgroundColor: bg }}
                />
              </div>
              <span className="text-gray-400" style={{ fontSize: '10px' }}>P{p.number}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-extrabold text-white" style={color ? { color } : {}}>
        {value}
      </span>
      <span className="text-xs text-white/60 mt-0.5">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data } = useStore();

  const completedCount = LEADERS.filter(l =>
    data.startingPoints.some(sp => sp.leaderId === l.id)
  ).length;

  const totalPossibleCheckIns = completedCount * 1;

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 55%, #002e80 100%)` }}
      >
        {/* Decorative circles */}
        <div
          className="absolute rounded-full opacity-10 pointer-events-none"
          style={{ width: 320, height: 320, backgroundColor: IBL_CYAN, top: -80, right: -60 }}
        />
        <div
          className="absolute rounded-full opacity-10 pointer-events-none"
          style={{ width: 160, height: 160, backgroundColor: IBL_PINK, bottom: -40, right: 120 }}
        />

        <div className="relative z-10 p-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: IBL_CYAN }}>
            IBL Energy · IEL Programme
          </p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
            Pioneer Tracker
          </h1>
          <p className="text-sm text-white/60 mb-8">
            Leadership development journey — 6 principles, 5 pioneers
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-8">
            <StatPill value={completedCount} label="Leaders started" />
            <div className="h-8 w-px bg-white/20" />
            <StatPill value={LEADERS.length} label="Total pioneers" />
            <div className="h-8 w-px bg-white/20" />
            <StatPill value={data.checkIns.length + data.biWeeklyCheckIns.length} label="Check-ins done" color={IBL_CYAN} />
          </div>
        </div>

        {/* Cyan bottom accent */}
        <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />
      </div>

      {/* ── Leader Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {LEADERS.map(leader => {
          const sp       = data.startingPoints.find(s => s.leaderId === leader.id);
          const checkIns = data.checkIns.filter(c => c.leaderId === leader.id);

          return (
            <div
              key={leader.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm
                         hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Gradient card header */}
              <div
                className="relative h-20 flex items-center px-5"
                style={{ background: `linear-gradient(120deg, ${IBL_NAVY} 0%, #003090 100%)` }}
              >
                {/* Decorative circle */}
                <div
                  className="absolute right-0 top-0 h-full aspect-square rounded-full opacity-20"
                  style={{ backgroundColor: IBL_CYAN, transform: 'translate(40%, -20%)' }}
                />

                <div className="flex items-center gap-3 w-full relative z-10">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center
                               justify-center text-white font-extrabold text-base flex-shrink-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${IBL_CYAN}40, ${IBL_NAVY})` }}
                  >
                    {leader.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-white text-base leading-none">{leader.name}</h2>
                    <p className="text-xs mt-1 truncate" style={{ color: IBL_CYAN, opacity: 0.9 }}>
                      {sp ? sp.team : 'Not yet started'}
                    </p>
                  </div>

                  {/* Status badge */}
                  {sp ? (
                    <span
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
                    >
                      ✓ Active
                    </span>
                  ) : (
                    <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white/70">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col flex-1 gap-4">

                {/* Principle bars or empty state */}
                {sp ? (
                  <PrincipleBars sp={sp} />
                ) : (
                  <div className="h-14 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-400">Reflection not started</p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-lg font-bold" style={{ color: IBL_NAVY }}>
                      {checkIns.length}
                    </span>
                    check-in{checkIns.length !== 1 ? 's' : ''}
                  </span>
                  {sp && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400">Since {formatDate(sp.submittedAt)}</span>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/leaders/${leader.id}`}
                    className="flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-semibold
                               bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors duration-200"
                  >
                    View Journey
                  </Link>
                  {!sp ? (
                    <Link
                      to={`/leaders/${leader.id}/starting-point`}
                      className="flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-semibold
                                 text-white transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: IBL_NAVY }}
                    >
                      Start Reflection
                    </Link>
                  ) : (
                    <Link
                      to={`/leaders/${leader.id}/checkin/new`}
                      className="flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-bold
                                 transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
                    >
                      + Check-In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 6 Principles Legend ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          The 6 Leadership Principles
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRINCIPLES.map(p => (
            <div key={p.id} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: IBL_NAVY, fontSize: 11 }}
              >
                {p.number}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{p.shortTitle}</p>
                <p className="text-xs text-gray-400 leading-relaxed mt-0.5 line-clamp-2">{p.expectation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
