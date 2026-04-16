import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { useStore } from '../context/StoreContext';
import { getLatestSP, getAllSPs } from '../context/StoreContext';
import { getLeader } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import PrincipleRadar from '../components/PrincipleRadar';
import type { PrincipleKey, CheckIn, StartingPoint } from '../types';

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
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {rating}/5
    </span>
  );
}

function ProgressBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className="h-2 rounded-full transition-all duration-500"
           style={{ width: `${(value / max) * 100}%`, backgroundColor: IBL_CYAN }} />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

// ── Progress chart (check-in self-ratings over time) ────────────────────────

function ProgressChart({ checkIns }: { checkIns: CheckIn[] }) {
  if (checkIns.length < 1) return null;

  const chronological = [...checkIns]
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const chartData = chronological.map(ci => ({
    label: ci.month || formatMonth(ci.submittedAt),
    rating: ci.selfRating,
    principle: PRINCIPLES.find(p => p.id === ci.selectedPrinciple)?.shortTitle ?? '',
  }));

  const avg = chartData.reduce((s, d) => s + d.rating, 0) / chartData.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-bold text-gray-900">Self-Rating Progress</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monthly self-rating across all check-ins</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold" style={{ color: IBL_CYAN }}>
            {avg.toFixed(1)}<span className="text-sm font-normal text-gray-400">/5</span>
          </p>
          <p className="text-xs text-gray-400">average</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
            formatter={(value: number, _: string, entry) => [
              `${value}/5`,
              entry.payload.principle || 'Self-rating',
            ]}
          />
          <ReferenceLine y={avg} stroke={IBL_PINK} strokeDasharray="4 2" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="rating"
            stroke={IBL_NAVY}
            strokeWidth={2.5}
            dot={{ fill: IBL_CYAN, stroke: IBL_NAVY, strokeWidth: 2, r: 5 }}
            activeDot={{ fill: IBL_NAVY, stroke: IBL_CYAN, strokeWidth: 2, r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {chartData.length > 1 && (() => {
        const first = chartData[0].rating;
        const last  = chartData[chartData.length - 1].rating;
        const delta = last - first;
        if (delta === 0) return null;
        return (
          <p className="text-xs mt-3 font-semibold"
             style={{ color: delta > 0 ? '#15803d' : '#b91c1c' }}>
            {delta > 0 ? `↑ +${delta.toFixed(1)} since first check-in` : `↓ ${delta.toFixed(1)} since first check-in`}
          </p>
        );
      })()}
    </div>
  );
}

// ── Reflection version history ───────────────────────────────────────────────

function ReflectionHistory({ versions }: { versions: StartingPoint[] }) {
  const [open, setOpen] = useState(false);
  if (versions.length <= 1) return null;
  const older = versions.slice(1); // versions[0] is latest, already shown above

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
             style={{ backgroundColor: IBL_NAVY }}>
          {older.length}
        </div>
        <div className="text-left flex-1">
          <p className="font-semibold text-gray-900 text-sm">Previous Reflection Versions</p>
          <p className="text-xs text-gray-400">
            {older.length} earlier version{older.length !== 1 ? 's' : ''} · click to compare
          </p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {older.map((sp, i) => (
            <div key={sp.id} className="px-5 py-4 border-b border-gray-50 last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  Version {versions.length - 1 - i}
                </span>
                <span className="text-xs text-gray-400">{formatDate(sp.submittedAt)}</span>
              </div>
              {/* Principle ratings comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRINCIPLES.map(p => {
                  const pr = sp[p.id as PrincipleKey];
                  return pr ? (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                           style={{ backgroundColor: IBL_NAVY, fontSize: 9 }}>
                        {p.number}
                      </div>
                      <span className="text-xs text-gray-600 flex-1 truncate">{p.shortTitle}</span>
                      <RatingBadge rating={pr.rating} />
                    </div>
                  ) : null;
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {sp.strongestPrinciple && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#E6FAFB' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: IBL_CYAN }}>Strongest</p>
                    <p className="text-xs text-gray-700">{sp.strongestPrinciple}</p>
                  </div>
                )}
                {sp.mainDevelopmentArea && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#fff0f7' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: IBL_PINK }}>Dev. area</p>
                    <p className="text-xs text-gray-700">{sp.mainDevelopmentArea}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Check-in card ────────────────────────────────────────────────────────────

function CheckInCard({ ci, index }: { ci: CheckIn; index: number }) {
  const principle = PRINCIPLES.find(p => p.id === ci.selectedPrinciple);
  const progressMap = {
    improved: { label: '↑ Improved',        bg: '#dcfce7', fg: '#15803d' },
    same:     { label: '→ About the same',   bg: '#fef9c3', fg: '#a16207' },
    declined: { label: '↓ Need to improve',  bg: '#fee2e2', fg: '#b91c1c' },
  };
  const progress = progressMap[ci.progressVersusLastMonth];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                    hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100"
           style={{ backgroundColor: '#f8fafc' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
             style={{ backgroundColor: IBL_NAVY, fontSize: 12 }}>
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
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: progress.bg, color: progress.fg }}>
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
          <div className="p-3 rounded-xl border"
               style={{ backgroundColor: '#fff0f7', borderColor: IBL_PINK }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: IBL_PINK }}>Support requested</p>
            <p className="text-sm text-gray-700">{ci.typeOfSupportNeeded}</p>
          </div>
        )}
        <p className="text-xs text-gray-400 pt-1">Submitted {formatDate(ci.submittedAt)}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderJourney() {
  const { leaderId } = useParams<{ leaderId: string }>();
  const navigate = useNavigate();
  const { data } = useStore();
  const leader = getLeader(leaderId ?? '');

  if (!leader) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Leader not found.</p>
        <Link to="/" className="mt-4 inline-block hover:underline" style={{ color: IBL_CYAN }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const sp         = getLatestSP(data.startingPoints, leader.id);
  const allSPs     = getAllSPs(data.startingPoints, leader.id);
  const checkIns   = data.checkIns
    .filter(c => c.leaderId === leader.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return (
    <div className="space-y-6">
      {/* ── Leader hero ── */}
      <div className="relative rounded-2xl overflow-hidden"
           style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 55%, #002e80 100%)` }}>
        <div className="absolute rounded-full opacity-10 pointer-events-none"
             style={{ width: 240, height: 240, backgroundColor: IBL_CYAN, top: -60, right: -40 }} />
        <div className="absolute rounded-full opacity-10 pointer-events-none"
             style={{ width: 100, height: 100, backgroundColor: IBL_PINK, bottom: -20, right: 160 }} />

        <div className="relative z-10 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white
                          font-extrabold text-2xl flex-shrink-0 shadow-xl border-2 border-white/20"
               style={{ background: `linear-gradient(135deg, ${IBL_CYAN}50, ${IBL_NAVY})` }}>
            {leader.initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{leader.name}</h1>
            {sp && (
              <p className="text-sm mt-0.5" style={{ color: IBL_CYAN, opacity: 0.9 }}>
                {sp.team} · {sp.email}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
              {sp ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}>
                  ✓ Reflection v{allSPs.length}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white/70">
                  No reflection yet
                </span>
              )}
              <span className="text-white/50 text-xs">
                {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
              </span>
              {allSPs.length > 1 && (
                <span className="text-white/50 text-xs">
                  · {allSPs.length} reflection versions
                </span>
              )}
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
                  Update Reflection
                </button>
              </>
            )}
          </div>
        </div>

        <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />
      </div>

      {/* ── Progress chart ── */}
      {checkIns.length > 0 && <ProgressChart checkIns={checkIns} />}

      {sp && (
        <>
          {/* ── Radar + Team perception ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-0.5">Principle Self-Ratings</h2>
              <p className="text-xs text-gray-400 mb-3">
                Latest reflection · v{allSPs.length} · {formatDate(sp.submittedAt)}
              </p>
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
                      <span className="text-xs font-semibold text-gray-900">
                        {value}/5 — {PERCEPTION_LABELS[value]}
                      </span>
                    </div>
                    <ProgressBar value={value} />
                  </div>
                ))}
              </div>
              {sp.oneThingTeamShouldFeel && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#E6FAFB' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: IBL_CYAN }}>
                    One thing I want my team to feel more of:
                  </p>
                  <p className="text-sm text-gray-800">{sp.oneThingTeamShouldFeel}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Principle deep-dive ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Principle Self-Assessment</h2>
            <div className="space-y-4">
              {PRINCIPLES.map(p => {
                const pr = sp[p.id as PrincipleKey];
                if (!pr) return null;
                return (
                  <div key={p.id} className="flex gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white
                                    font-bold text-xs flex-shrink-0"
                         style={{ backgroundColor: IBL_NAVY }}>
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

          {/* ── Summary & Intentions ── */}
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
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                     style={{ color: accent ?? '#9ca3af' }}>
                    {label}
                  </p>
                  <p className="text-gray-900">{value}</p>
                </div>
              ) : null)}
            </div>
          </div>

          {/* ── Leadership Inspiration ── */}
          {(sp.leadershipQualities || sp.behavioursAdmired) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Leadership Inspiration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {sp.leadershipQualities && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Qualities I admire
                    </p>
                    <p className="text-gray-900 whitespace-pre-line">{sp.leadershipQualities}</p>
                  </div>
                )}
                {sp.behavioursAdmired && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Behaviours I admired
                    </p>
                    <p className="text-gray-900 whitespace-pre-line">{sp.behavioursAdmired}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Reflection version history ── */}
          <ReflectionHistory versions={allSPs} />
        </>
      )}

      {/* ── Check-ins ── */}
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
