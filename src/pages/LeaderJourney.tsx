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
  const colors = [
    '',
    'bg-red-100 text-red-700',
    'bg-orange-100 text-orange-700',
    'bg-yellow-100 text-yellow-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
  ];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors[rating] ?? 'bg-gray-100 text-gray-500'}`}>
      {rating}/5
    </span>
  );
}

function ProgressBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: IBL_CYAN }}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CheckInCard({ ci }: { ci: CheckIn }) {
  const principle = PRINCIPLES.find(p => p.id === ci.selectedPrinciple);
  const progressColors = {
    improved: 'text-green-600 bg-green-50',
    same:     'text-yellow-600 bg-yellow-50',
    declined: 'text-red-600 bg-red-50',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400 font-medium">{ci.month}</p>
          <p className="font-semibold text-gray-900 mt-0.5">
            {principle ? `P${principle.number} — ${principle.shortTitle}` : ci.selectedPrinciple}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <RatingBadge rating={ci.selfRating} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${progressColors[ci.progressVersusLastMonth]}`}>
            {ci.progressVersusLastMonth === 'improved' ? '↑ Improved' : ci.progressVersusLastMonth === 'declined' ? '↓ Declined' : '→ Same'}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {ci.whatDidWell && (
          <div>
            <span className="font-medium text-gray-600">What went well: </span>
            <span className="text-gray-700">{ci.whatDidWell}</span>
          </div>
        )}
        {ci.focusForNext30Days && (
          <div>
            <span className="font-medium text-gray-600">Next focus: </span>
            <span className="text-gray-700">{ci.focusForNext30Days}</span>
          </div>
        )}
        {ci.supportNeeded && ci.typeOfSupportNeeded && (
          <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: '#FFF0F7', borderColor: IBL_PINK, border: '1px solid' }}>
            <span className="font-semibold" style={{ color: IBL_PINK }}>Support requested: </span>
            <span className="text-gray-700">{ci.typeOfSupportNeeded}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">Submitted {formatDate(ci.submittedAt)}</p>
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
      {/* Leader header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-2" style={{ backgroundColor: IBL_NAVY }} />
        <div className="p-6 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ backgroundColor: IBL_NAVY }}
          >
            {leader.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: IBL_NAVY }}>{leader.name}</h1>
            {sp && <p className="text-sm text-gray-500">{sp.team} · {sp.email}</p>}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              {sp ? (
                <span className="font-medium" style={{ color: IBL_CYAN }}>✓ Starting reflection complete</span>
              ) : (
                <span className="text-gray-400">No starting reflection yet</span>
              )}
              <span>·</span>
              <span>{checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!sp ? (
              <button
                onClick={() => navigate(`/leaders/${leader.id}/starting-point`)}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
                style={{ backgroundColor: IBL_NAVY }}
              >
                Complete Reflection
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/leaders/${leader.id}/checkin/new`)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
                >
                  Add Check-In
                </button>
                <button
                  onClick={() => navigate(`/leaders/${leader.id}/starting-point`)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Edit Reflection
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {sp && (
        <>
          {/* Radar + Team perception */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Principle Self-Ratings</h2>
              <p className="text-xs text-gray-400 mb-3">Starting point reflection</p>
              <PrincipleRadar startingPoint={sp} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Team Perception</h2>
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
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
            {checkIns.map(ci => (
              <CheckInCard key={ci.id} ci={ci} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
