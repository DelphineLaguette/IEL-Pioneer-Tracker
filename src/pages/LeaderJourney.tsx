import { Link, useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getLeader } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import PrincipleRadar from '../components/PrincipleRadar';
import type { PrincipleKey, CheckIn } from '../types';

// IBL Energy brand colors
const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';
const IBL_PINK  = '#FF51A1';

const RATING_LABELS: Record<number, string> = {
  1: 'Rarely true of me today',
  2: 'Sometimes true, but inconsistent',
  3: 'Often true in my leadership',
  4: 'Strongly present and visible',
  5: 'A clear strength, consistently demonstrated',
};

const PERCEPTION_LABELS: Record<number, string> = {
  1: 'Not at all',
  2: 'Slightly',
  3: 'Moderately',
  4: 'Quite well',
  5: 'Completely',
};

function RatingBadge({ rating }: { rating: number }) {
  const styles: Record<number, { bg: string; color: string }> = {
    1: { bg: '#fee2e2', color: '#b91c1c' },
    2: { bg: '#ffedd5', color: '#c2410c' },
    3: { bg: '#fef9c3', color: '#a16207' },
    4: { bg: '#dbeafe', color: '#1d4ed8' },
    5: { bg: '#dcfce7', color: '#15803d' },
  };
  const s = styles[rating] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {rating}/5
    </span>
  );
}

function ProgressBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: IBL_CYAN }}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CheckInCard({ ci, index }: { ci: CheckIn; index: number }) {
  const principle = PRINCIPLES.find(p => p.id === ci.selectedPrinciple);
  const progressMap = {
    improved: { label: '↑ Improved',         bg: '#dcfce7', fg: '#15803d' },
    same:     { label: '→ About the same',    bg: '#fef9c3', fg: '#a16207' },
    declined: { label: '↓ Need to improve',   bg: '#fee2e2', fg: '#b91c1c' },
  };
  const progress = progressMap[ci.progressVersusLastMonth];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                    hover:shadow-md transition-all duration-200">
      {/* Card top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100"
           style={{ backgroundColor: '#f8fafc' }}>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: IBL_NAVY, fontSize: 12 }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{ci.month}</p>
          <p className="font-semibold text-gray-900 text-sm truncate">
            {principle ? `P${principle.number} — ${principle.shortTitle}` : ci.selectedPrinciple}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RatingBadge rating={ci.selfRating} />
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: progress.bg, color: progress.fg }}
          >
            {progress.label}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {ci.whatDidWell && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#f0fdf4' }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#15803d' }}>What went well</p>
            <p className="text-sm text-gray-700">{ci.whatDidWell}</p>
          </div>
        )}
        {ci.focusForNext30Days && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#eff6ff' }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#1d4ed8' }}>Next 30-day focus</p>
            <p className="text-sm text-gray-700">{ci.focusForNext30Days}</p>
          </div>
        )}
        {ci.supportNeeded && ci.typeOfSupportNeeded && (
          <div className="p-3 rounded-xl border" style={{ backgroundColor: '#fff0f7', borderColor: IBL_PINK }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: IBL_PINK }}>Support requested</p>
            <p className="text-sm text-gray-700">{ci.typeOfSupportNeeded}</p>
          </div>
        )}
        <p className="text-xs text-gray-400 pt-1">Submitted {formatDate(ci.submittedAt)}</p>
      </div>
    </div>
  );
}

export default function LeaderJourney() {
  const { leaderId } = useParams<{ leaderId: string }>();
  const navigate = useNavigate();
  const { data } = useStore();
  const leader = getLeader(leaderId ?? '');

  if (!leader) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Leader not found.</p>
        <Link to="/" className="mt-4 inline-block hover:underline" style={{ color: IBL_CYAN }}>Back to dashboard</Link>
      </div>
    );
  }

  const sp = data.startingPoints.find(s => s.leaderId === leader.id);
  const checkIns = data.checkIns
    .filter(c => c.leaderId === leader.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-6">
      {/* Leader hero header */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 55%, #002e80 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute rounded-full opacity-10 pointer-events-none"
          style={{ width: 240, height: 240, backgroundColor: IBL_CYAN, top: -60, right: -40 }} />
        <div className="absolute rounded-full opacity-10 pointer-events-none"
          style={{ width: 100, height: 100, backgroundColor: IBL_PINK, bottom: -20, right: 160 }} />

        <div className="relative z-10 p-6 flex items-center gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl
                       flex-shrink-0 shadow-xl border-2 border-white/20"
            style={{ background: `linear-gradient(135deg, ${IBL_CYAN}50, ${IBL_NAVY})` }}
          >
            {leader.initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{leader.name}</h1>
            {sp && (
              <p className="text-sm mt-0.5" style={{ color: IBL_CYAN, opacity: 0.9 }}>
                {sp.team} · {sp.email}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm">
              {sp ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}>
                  ✓ Reflection complete
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white/70">
                  Not yet started
                </span>
              )}
              <span className="text-white/50 text-xs">
                {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            {!sp ? (
              <button
                onClick={() => navigate(`/leaders/${leader.id}/starting-point`)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
              >
                Complete Reflection
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/leaders/${leader.id}/checkin/new`)}
                  className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
                >
                  + Add Check-In
                </button>
                <button
                  onClick={() => navigate(`/leaders/${leader.id}/starting-point`)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Edit Reflection
                </button>
              </>
            )}
          </div>
        </div>

        <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />
      </div>

      {sp && (
        <>
          {/* Radar + Team perception */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-0.5">Principle Self-Ratings</h2>
              <p className="text-xs text-gray-400 mb-3">Starting point reflection</p>
              <PrincipleRadar startingPoint={sp} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-0.5">Team Perception</h2>
              <p className="text-xs text-gray-400 mb-4">How the leader perceives their team's experience</p>
              <div className="space-y-3">
                {[
                  { label: 'Clear on direction',             value: sp.teamClearOnDirection },
                  { label: 'Understands our purpose',        value: sp.teamUnderstandsPurpose },
                  { label: 'Treated fairly & with respect',  value: sp.teamTreatedFairly },
                  { label: 'Encouraged to grow',             value: sp.teamEncouraged },
                  { label: 'Safe to share ideas & mistakes', value: sp.teamSafeToShare },
                  { label: 'Trusts my word',                 value: sp.teamTrustsWord },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{label}</span>
                      <span className="text-xs font-semibold text-gray-900">{value}/5 — {PERCEPTION_LABELS[value]}</span>
                    </div>
                    <ProgressBar value={value} />
                  </div>
                ))}
              </div>
              {sp.oneThingTeamShouldFeel && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#E6FAFB' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: IBL_CYAN }}>One thing I want my team to feel more of:</p>
                  <p className="text-sm text-gray-800">{sp.oneThingTeamShouldFeel}</p>
                </div>
              )}
            </div>
          </div>

          {/* Principle deep-dive */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Principle Self-Assessment</h2>
            <div className="space-y-4">
              {PRINCIPLES.map(p => {
                const pr = sp[p.id as PrincipleKey];
                if (!pr) return null;
                return (
                  <div key={p.id} className="flex gap-4 p-3 rounded-lg bg-gray-50">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                      style={{ backgroundColor: IBL_NAVY }}
                    >
                      {p.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{p.shortTitle}</span>
                        <RatingBadge rating={pr.rating} />
                        <span className="text-xs text-gray-400">{RATING_LABELS[pr.rating]}</span>
                      </div>
                      {pr.evidence && (
                        <p className="text-sm text-gray-600">{pr.evidence}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Summary & Intentions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Strongest principle',    value: sp.strongestPrinciple,       accent: IBL_CYAN },
                { label: 'Main development area',  value: sp.mainDevelopmentArea,       accent: IBL_PINK },
                { label: 'Why this matters',       value: sp.whyDevelopmentAreaMatters, accent: null },
                { label: 'Leadership intention',   value: sp.leadershipIntention,       accent: null },
              ].map(({ label, value, accent }) => value ? (
                <div key={label} className="p-3 bg-gray-50 rounded-lg">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: accent ?? '#9ca3af' }}
                  >
                    {label}
                  </p>
                  <p className="text-gray-900">{value}</p>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Leadership inspiration */}
          {(sp.leadershipQualities || sp.behavioursAdmired) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Leadership Inspiration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {sp.leadershipQualities && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Qualities I admire</p>
                    <p className="text-gray-900">{sp.leadershipQualities}</p>
                  </div>
                )}
                {sp.behavioursAdmired && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Behaviours I admired</p>
                    <p className="text-gray-900">{sp.behavioursAdmired}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Check-ins */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg" style={{ color: IBL_NAVY }}>30-Day Check-Ins</h2>
          {sp && (
            <Link
              to={`/leaders/${leader.id}/checkin/new`}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
            >
              + Add Check-In
            </Link>
          )}
        </div>

        {checkIns.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-400 text-sm">
              {sp ? 'No check-ins yet. Add the first one!' : 'Complete the starting reflection first.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkIns.map((ci, idx) => (
              <CheckInCard key={ci.id} ci={ci} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
