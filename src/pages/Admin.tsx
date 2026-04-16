import { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { LEADERS, getLeader } from '../data/leaders';
import { PRINCIPLES, getPrinciple } from '../data/principles';
import type { CheckIn, StartingPoint } from '../types';

const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';
const IBL_PINK  = '#FF51A1';

const RATING_COLORS: Record<number, { bg: string; fg: string }> = {
  1: { bg: '#fee2e2', fg: '#b91c1c' },
  2: { bg: '#ffedd5', fg: '#c2410c' },
  3: { bg: '#fef9c3', fg: '#a16207' },
  4: { bg: '#dbeafe', fg: '#1d4ed8' },
  5: { bg: '#dcfce7', fg: '#15803d' },
};

const PROGRESS_CONFIG = {
  improved: { label: '↑ Improved',         bg: '#dcfce7', fg: '#15803d' },
  same:     { label: '→ Same',             bg: '#fef9c3', fg: '#a16207' },
  declined: { label: '↓ Need to improve',  bg: '#fee2e2', fg: '#b91c1c' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function RatingBadge({ rating }: { rating: number }) {
  const c = RATING_COLORS[rating] ?? { bg: '#f3f4f6', fg: '#6b7280' };
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: c.bg, color: c.fg }}>
      {rating}/5
    </span>
  );
}

// ── Expandable check-in detail card ──────────────────────────────────────────

function InfoBlock({ label, value, accent }: { label: string; value?: string; accent?: boolean }) {
  if (!value) return null;
  return (
    <div className="p-3 rounded-xl"
         style={accent
           ? { backgroundColor: '#fff0f7', border: `1px solid ${IBL_PINK}40` }
           : { backgroundColor: '#f8fafc' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1"
         style={{ color: accent ? IBL_PINK : '#9ca3af' }}>
        {label}
      </p>
      <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mt-2 mb-3">
      <div className="h-px flex-1 bg-gray-100" />
      <p className="text-xs font-bold uppercase tracking-widest px-2" style={{ color: IBL_NAVY }}>
        {children}
      </p>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

function CheckInDetail({ ci }: { ci: CheckIn }) {
  const [expanded, setExpanded] = useState(false);
  const leader   = getLeader(ci.leaderId);
  const principle = getPrinciple(ci.selectedPrinciple);
  const progress  = PROGRESS_CONFIG[ci.progressVersusLastMonth];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Summary row (always visible) ── */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left hover:bg-slate-50 transition-colors duration-150"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white
                       font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: IBL_NAVY }}
          >
            {leader?.initials}
          </div>

          {/* Leader / month / principle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900">{leader?.name}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-sm text-gray-500">{ci.month}</span>
              {principle && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                    P{principle.number} — {principle.shortTitle}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
              {ci.team && <span>{ci.team}</span>}
              {ci.accountabilityPartner && (
                <><span>·</span><span>Partner: {ci.accountabilityPartner}</span></>
              )}
              <span>·</span>
              <span>Submitted {formatDate(ci.submittedAt)}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <RatingBadge rating={ci.selfRating} />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: progress.bg, color: progress.fg }}>
              {progress.label}
            </span>
            {ci.supportNeeded && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>
                ⚠ Support
              </span>
            )}
            {/* Chevron */}
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-6 pt-4 space-y-3">

          {/* Basic info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Leader',  value: leader?.name },
              { label: 'Email',   value: ci.email   || '—' },
              { label: 'Team',    value: ci.team    || '—' },
              { label: 'Month',   value: ci.month },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* ── This month's focus ── */}
          <SectionTitle>This Month's Focus</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBlock
              label="Selected Leadership Principle"
              value={principle ? `P${principle.number} — ${principle.title}` : ci.selectedPrinciple}
            />
            <InfoBlock label="Why this principle this month?"   value={ci.whyThisPrinciple} />
            <InfoBlock label="3 behaviours I will practice"     value={ci.threeBehaviours} />
            <InfoBlock label="Success measure"                  value={ci.successMeasure} />
            <InfoBlock label="Accountability partner"           value={ci.accountabilityPartner} />
          </div>

          {/* ── Reflection ── */}
          <SectionTitle>Monthly Reflection</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBlock label="What I did well this month"  value={ci.whatDidWell} />
            <InfoBlock label="Where I fell short"          value={ci.whereFellShort} />
            <InfoBlock label="Concrete example"            value={ci.concreteExample} />
            <InfoBlock label="Main obstacle"               value={ci.mainObstacle} />
          </div>

          {/* ── Feedback & progress ── */}
          <SectionTitle>Feedback & Progress</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBlock label="Feedback from team"    value={ci.feedbackFromTeam} />
            <InfoBlock label="Feedback from manager" value={ci.feedbackFromManager} />
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Self-rating this month
              </p>
              <RatingBadge rating={ci.selfRating} />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Progress versus last month
              </p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                    style={{ backgroundColor: progress.bg, color: progress.fg }}>
                {progress.label}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                Support needed?
              </p>
              <span className="text-sm font-semibold"
                    style={{ color: ci.supportNeeded ? IBL_PINK : '#15803d' }}>
                {ci.supportNeeded ? 'Yes' : 'No'}
              </span>
            </div>
            {ci.supportNeeded && (
              <InfoBlock label="Type of support needed" value={ci.typeOfSupportNeeded} accent />
            )}
          </div>

          {/* ── Next 30 days ── */}
          {ci.focusForNext30Days && (
            <>
              <SectionTitle>Looking Forward</SectionTitle>
              <div className="p-4 rounded-xl border-l-4"
                   style={{ backgroundColor: '#eff6ff', borderLeftColor: IBL_CYAN }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#1d4ed8' }}>
                  Focus for next 30 days
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">{ci.focusForNext30Days}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Leader row in the progress matrix ────────────────────────────────────────

function LeaderRow({
  leader,
  sp,
  checkIns,
}: {
  leader: ReturnType<typeof getLeader> & object;
  sp: StartingPoint | undefined;
  checkIns: CheckIn[];
}) {
  const sorted       = [...checkIns].sort((a, b) =>
    new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
  const latest       = sorted[sorted.length - 1];
  const ratings      = checkIns.map(c => c.selfRating).filter(r => r > 0);
  const avgRating    = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  const needsSupport = latest?.supportNeeded ?? false;
  const principles   = [...new Set(checkIns.map(c => c.selectedPrinciple).filter(Boolean))];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                     ${needsSupport ? 'border border-pink-200' : 'border border-transparent hover:bg-slate-50'}`}
         style={needsSupport ? { backgroundColor: '#fff8fb' } : {}}>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold
                      text-xs flex-shrink-0"
           style={{ backgroundColor: IBL_NAVY }}>
        {leader.initials}
      </div>

      {/* Name + team */}
      <div className="w-28 flex-shrink-0 min-w-0">
        <p className="font-bold text-sm text-gray-900 truncate">{leader.name}</p>
        <p className="text-xs text-gray-400 truncate">{sp?.team ?? '—'}</p>
      </div>

      {/* Reflection */}
      <div className="w-24 flex-shrink-0">
        {sp ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            ✓ Done
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
            Pending
          </span>
        )}
      </div>

      {/* Check-in count */}
      <div className="w-20 flex-shrink-0 text-center">
        <p className="text-xl font-extrabold" style={{ color: IBL_NAVY }}>{checkIns.length}</p>
        <p className="text-xs text-gray-400 leading-none">check-in{checkIns.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Avg rating */}
      <div className="w-20 flex-shrink-0 text-center">
        {avgRating ? (
          <>
            <p className="text-xl font-extrabold" style={{ color: IBL_CYAN }}>{avgRating}</p>
            <p className="text-xs text-gray-400 leading-none">avg / 5</p>
          </>
        ) : <span className="text-xs text-gray-300">—</span>}
      </div>

      {/* Latest progress */}
      <div className="w-36 flex-shrink-0">
        {latest ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: PROGRESS_CONFIG[latest.progressVersusLastMonth].bg,
                         color: PROGRESS_CONFIG[latest.progressVersusLastMonth].fg }}>
            {PROGRESS_CONFIG[latest.progressVersusLastMonth].label}
          </span>
        ) : <span className="text-xs text-gray-300">No check-ins</span>}
      </div>

      {/* Principles covered */}
      <div className="flex-1 flex flex-wrap gap-1 min-w-0">
        {principles.length > 0 ? principles.map(pid => {
          const p = getPrinciple(pid);
          return p ? (
            <span key={pid} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              P{p.number}
            </span>
          ) : null;
        }) : <span className="text-xs text-gray-300">None yet</span>}
      </div>

      {/* Support flag */}
      <div className="w-24 flex-shrink-0 text-right">
        {needsSupport ? (
          <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>
            ⚠ Support
          </span>
        ) : <span className="text-gray-200 text-sm">—</span>}
      </div>
    </div>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { data } = useStore();
  const [filterLeader,    setFilterLeader]    = useState('');
  const [filterPrinciple, setFilterPrinciple] = useState('');
  const [filterSupport,   setFilterSupport]   = useState(false);

  // ── Overview stats ──────────────────────────────────────────────────────────
  const completedReflections = LEADERS.filter(l =>
    data.startingPoints.some(s => s.leaderId === l.id)
  ).length;
  const allRatings    = data.checkIns.map(c => c.selfRating).filter(r => r > 0);
  const avgRating     = allRatings.length
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : '—';
  const supportCount  = data.checkIns.filter(c => c.supportNeeded).length;
  const improvedCount = data.checkIns.filter(c => c.progressVersusLastMonth === 'improved').length;

  // ── Principle distribution ──────────────────────────────────────────────────
  const principleCounts = PRINCIPLES.map(p => ({
    principle: p,
    count: data.checkIns.filter(c => c.selectedPrinciple === p.id).length,
  }));

  // ── Support alerts ──────────────────────────────────────────────────────────
  const supportAlerts = data.checkIns
    .filter(c => c.supportNeeded)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // ── Filtered check-ins ──────────────────────────────────────────────────────
  const filtered = data.checkIns
    .filter(ci => {
      if (filterLeader    && ci.leaderId           !== filterLeader)    return false;
      if (filterPrinciple && ci.selectedPrinciple  !== filterPrinciple) return false;
      if (filterSupport   && !ci.supportNeeded)                         return false;
      return true;
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const hasFilters = filterLeader || filterPrinciple || filterSupport;

  return (
    <div className="space-y-6">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden"
           style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 55%, #002e80 100%)` }}>
        <div className="absolute rounded-full opacity-10 pointer-events-none"
             style={{ width: 300, height: 300, backgroundColor: IBL_CYAN, top: -80, right: -40 }} />
        <div className="absolute rounded-full opacity-10 pointer-events-none"
             style={{ width: 120, height: 120, backgroundColor: IBL_PINK, bottom: -30, right: 220 }} />
        <div className="relative z-10 p-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: IBL_CYAN }}>
            IBL Energy · IEL Programme
          </p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">
            Full visibility into every pioneer's progress across the 6 leadership principles
          </p>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />
      </div>

      {/* ── Overview stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {([
          { label: 'Pioneers',        value: LEADERS.length,               sub: 'total',            color: IBL_NAVY },
          { label: 'Reflections',     value: completedReflections,         sub: 'completed',        color: '#15803d' },
          { label: 'Check-Ins',       value: data.checkIns.length,         sub: 'submitted',        color: IBL_CYAN },
          { label: 'Avg Self-Rating', value: avgRating,                    sub: 'out of 5',         color: '#1d4ed8' },
          { label: 'Support Flags',   value: supportCount,                 sub: 'need attention',   color: '#be185d' },
        ] as const).map(s => (
          <div key={s.label}
               className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Support Needed Alerts ────────────────────────────────────────────── */}
      {supportAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100"
               style={{ backgroundColor: '#fff8fb' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm"
                 style={{ backgroundColor: IBL_PINK }}>!</div>
            <h2 className="font-bold text-gray-900">Support Needed</h2>
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>
              {supportAlerts.length} flag{supportAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {supportAlerts.map(ci => {
              const leader    = getLeader(ci.leaderId);
              const principle = getPrinciple(ci.selectedPrinciple);
              return (
                <div key={ci.id}
                     className="flex items-start gap-3 p-4 rounded-xl border"
                     style={{ backgroundColor: '#fff8fb', borderColor: `${IBL_PINK}30` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white
                                  font-bold text-sm flex-shrink-0"
                       style={{ backgroundColor: IBL_NAVY }}>
                    {leader?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{leader?.name}
                      <span className="font-normal text-gray-400"> · {ci.month}</span>
                    </p>
                    {principle && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        P{principle.number} — {principle.shortTitle}
                      </p>
                    )}
                    {ci.typeOfSupportNeeded && (
                      <p className="text-sm text-gray-800 mt-2 p-2 rounded-lg"
                         style={{ backgroundColor: '#fff0f7' }}>
                        "{ci.typeOfSupportNeeded}"
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(ci.submittedAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pioneer Progress Matrix ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
               style={{ backgroundColor: IBL_NAVY }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0
                       0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2
                       2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900">Pioneer Progress Matrix</h2>
        </div>

        {/* Column headers */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-gray-100
                        text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div className="w-9 flex-shrink-0" />
          <div className="w-28 flex-shrink-0">Leader</div>
          <div className="w-24 flex-shrink-0">Reflection</div>
          <div className="w-20 flex-shrink-0 text-center">Check-Ins</div>
          <div className="w-20 flex-shrink-0 text-center">Avg Rating</div>
          <div className="w-36 flex-shrink-0">Last Progress</div>
          <div className="flex-1">Principles Covered</div>
          <div className="w-24 flex-shrink-0 text-right">Support</div>
        </div>

        <div className="p-3 space-y-1">
          {LEADERS.map(leader => {
            const sp       = data.startingPoints.find(s => s.leaderId === leader.id);
            const checkIns = data.checkIns.filter(c => c.leaderId === leader.id);
            return (
              <LeaderRow key={leader.id} leader={leader} sp={sp} checkIns={checkIns} />
            );
          })}
        </div>
      </div>

      {/* ── Principle Focus Distribution ─────────────────────────────────────── */}
      {data.checkIns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Principle Focus Distribution</h2>
          <p className="text-xs text-gray-400 mb-5">
            How often each principle has been selected across all check-ins
            {improvedCount > 0 && ` · ${improvedCount} of ${data.checkIns.length} check-ins show improvement`}
          </p>
          <div className="space-y-3">
            {principleCounts.map(({ principle: p, count }) => {
              const pct = data.checkIns.length > 0 ? (count / data.checkIns.length) * 100 : 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white
                                  font-bold flex-shrink-0"
                       style={{ backgroundColor: IBL_NAVY, fontSize: 11 }}>
                    {p.number}
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-36 flex-shrink-0 truncate">
                    {p.shortTitle}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full transition-all duration-700"
                         style={{ width: `${pct}%`,
                                  backgroundColor: count > 0 ? IBL_CYAN : '#e5e7eb' }} />
                  </div>
                  <span className="text-sm font-bold w-20 text-right flex-shrink-0"
                        style={{ color: count > 0 ? IBL_NAVY : '#d1d5db' }}>
                    {count} {count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 30-Day Check-In Browser ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                 style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                         M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">30-Day Check-In Browser</h2>
              <p className="text-xs text-gray-400">
                {filtered.length} of {data.checkIns.length} check-in{data.checkIns.length !== 1 ? 's' : ''} shown
                · Click any row to expand full detail
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterLeader}
              onChange={e => setFilterLeader(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#00D0DA]"
            >
              <option value="">All leaders</option>
              {LEADERS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            <select
              value={filterPrinciple}
              onChange={e => setFilterPrinciple(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#00D0DA]"
            >
              <option value="">All principles</option>
              {PRINCIPLES.map(p => (
                <option key={p.id} value={p.id}>P{p.number} — {p.shortTitle}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFilterSupport(v => !v)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
              style={filterSupport
                ? { backgroundColor: '#fff0f7', color: IBL_PINK, borderColor: IBL_PINK }
                : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}
            >
              ⚠ Support needed only
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterLeader('');
                  setFilterPrinciple('');
                  setFilterSupport(false);
                }}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Check-in list */}
        <div className="p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">
                {data.checkIns.length === 0
                  ? 'No check-ins have been submitted yet.'
                  : 'No check-ins match the selected filters.'}
              </p>
            </div>
          ) : (
            filtered.map(ci => <CheckInDetail key={ci.id} ci={ci} />)
          )}
        </div>
      </div>

    </div>
  );
}
