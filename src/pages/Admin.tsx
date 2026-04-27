import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LEADERS, getLeader } from '../data/leaders';
import { exportToExcel, exportToPowerPoint } from '../utils/exports';
import { PRINCIPLES, getPrinciple } from '../data/principles';
import type { CheckIn, StartingPoint, BiWeeklyCheckIn } from '../types';

// ── Export button with loading state ─────────────────────────────────────────
function ExportButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    try { await onClick(); } finally { setLoading(false); }
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                 bg-white/10 hover:bg-white/20 text-white disabled:opacity-60"
    >
      <span>{loading ? '…' : icon}</span>
      {loading ? 'Generating…' : label}
    </button>
  );
}

// ── Mini sparkline (inline SVG, no extra deps) ────────────────────────────────
function Sparkline({ ratings }: { ratings: number[] }) {
  if (ratings.length < 2) {
    // Single dot
    return (
      <svg width={56} height={24} className="flex-shrink-0">
        <circle cx={28} cy={12} r={4} fill={IBL_CYAN} />
      </svg>
    );
  }
  const W = 56, H = 24, PAD = 4;
  const toX = (i: number) => PAD + (i / (ratings.length - 1)) * (W - PAD * 2);
  const toY = (r: number) => H - PAD - ((r - 1) / 4) * (H - PAD * 2);
  const pts = ratings.map((r, i) => ({ x: toX(i), y: toY(r) }));
  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const trend = last.y < prev.y ? IBL_CYAN : last.y > prev.y ? '#f87171' : '#fbbf24';
  return (
    <svg width={W} height={H} className="flex-shrink-0">
      <polyline points={polyline} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinejoin="round" />
      <polyline
        points={`${prev.x.toFixed(1)},${prev.y.toFixed(1)} ${last.x.toFixed(1)},${last.y.toFixed(1)}`}
        fill="none" stroke={trend} strokeWidth="2" strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3.5 : 2}
                fill={i === pts.length - 1 ? IBL_NAVY : '#cbd5e1'} />
      ))}
    </svg>
  );
}

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

const RATING_LABELS: Record<number, string> = {
  1: 'Rarely true of me today',
  2: 'Sometimes true, but inconsistent',
  3: 'Often true in my leadership',
  4: 'Strongly present and visible',
  5: 'A clear strength, consistently demonstrated',
};

const PROGRESS_CONFIG = {
  improved: { label: '↑ Improved',        bg: '#dcfce7', fg: '#15803d' },
  same:     { label: '→ About the same',  bg: '#fef9c3', fg: '#a16207' },
  declined: { label: '↓ Need to improve', bg: '#fee2e2', fg: '#b91c1c' },
};

const BW_STATUS_CONFIG = {
  'on-track':        { label: 'On Track',        bg: '#dcfce7', fg: '#15803d' },
  'progressing':     { label: 'Progressing',      bg: '#fef9c3', fg: '#a16207' },
  'needs-attention': { label: 'Needs Attention',  bg: '#fee2e2', fg: '#b91c1c' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function RatingBadge({ rating }: { rating: number }) {
  const c = RATING_COLORS[rating] ?? { bg: '#f3f4f6', fg: '#6b7280' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold"
          style={{ backgroundColor: c.bg, color: c.fg }}>
      {rating}/5
      {RATING_LABELS[rating] && (
        <span className="font-normal text-xs opacity-80">— {RATING_LABELS[rating]}</span>
      )}
    </span>
  );
}

// ── Shared form-style field display ──────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );
}

function TextField({ label, value }: { label: string; value?: string }) {
  if (!value) return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-300 italic">—</p>
    </div>
  );
  return (
    <FormField label={label}>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{value}</p>
    </FormField>
  );
}

function FormDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: IBL_NAVY }}>
        {title}
      </span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

// ── Full check-in card (always visible, form-style) ──────────────────────────

function CheckInCard({ ci, leaderRatings }: { ci: CheckIn; leaderRatings: number[] }) {
  const leader    = getLeader(ci.leaderId);
  const principle = getPrinciple(ci.selectedPrinciple);
  const progress  = PROGRESS_CONFIG[ci.progressVersusLastMonth];

  // Delta vs previous check-in for this leader
  const ciIdx   = leaderRatings.indexOf(ci.selfRating); // approximate; use position in sorted list
  const myPos   = leaderRatings.length - 1; // current card is the most recent shown
  const prevRating = leaderRatings[leaderRatings.length - 2];
  const delta   = leaderRatings.length > 1 ? ci.selfRating - prevRating : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Header strip ── */}
      <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-100"
           style={{ background: `linear-gradient(135deg, ${IBL_NAVY}08 0%, ${IBL_CYAN}10 100%)` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white
                        font-bold text-sm flex-shrink-0"
             style={{ backgroundColor: IBL_NAVY }}>
          {leader?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{leader?.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(ci.submittedAt)}</p>
        </div>

        {/* Evolution sparkline + rating */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkline ratings={leaderRatings} />
              <span className="text-lg font-extrabold" style={{ color: IBL_NAVY }}>
                {ci.selfRating}<span className="text-xs font-normal text-gray-400">/5</span>
              </span>
            </div>
            {delta !== null && delta !== 0 && (
              <span className="text-xs font-semibold"
                    style={{ color: delta > 0 ? '#15803d' : '#b91c1c' }}>
                {delta > 0 ? `↑ +${delta}` : `↓ ${delta}`} vs prev
              </span>
            )}
            {delta === 0 && leaderRatings.length > 1 && (
              <span className="text-xs text-gray-400">= same as prev</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: progress.bg, color: progress.fg }}>
            {progress.label}
          </span>
          {ci.supportNeeded && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>
              ⚠ Support needed
            </span>
          )}
        </div>
      </div>

      {/* ── Form body ── */}
      <div className="px-6 py-5 space-y-5">

        {/* Section 1 – About This Month */}
        <FormDivider title="About This Month" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TextField label="Leader name" value={leader?.name} />
          <TextField label="Email"       value={ci.email || '—'} />
          <TextField label="Team"        value={ci.team  || '—'} />
          <TextField label="Month"       value={ci.month} />
        </div>

        {/* Section 2 – This Month's Focus */}
        <FormDivider title="This Month's Focus" />
        <div className="space-y-4">
          <FormField label="Selected leadership principle">
            {principle ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1
                               rounded-full" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                P{principle.number} — {principle.title}
              </span>
            ) : (
              <p className="text-sm text-gray-300 italic">—</p>
            )}
          </FormField>
          <TextField label="Why this principle this month?"  value={ci.whyThisPrinciple} />
          <TextField label="3 behaviours I will practice"    value={ci.threeBehaviours} />
          <TextField label="Success measure"                 value={ci.successMeasure} />
          <TextField label="Accountability partner"          value={ci.accountabilityPartner} />
        </div>

        {/* Section 3 – Reflection */}
        <FormDivider title="Reflection on This Month" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="What I did well this month" value={ci.whatDidWell} />
          <TextField label="Where I fell short"         value={ci.whereFellShort} />
          <TextField label="Concrete example"           value={ci.concreteExample} />
          <TextField label="Main obstacle"              value={ci.mainObstacle} />
        </div>

        {/* Section 4 – Feedback & Progress */}
        <FormDivider title="Feedback & Progress" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Feedback from team"    value={ci.feedbackFromTeam} />
          <TextField label="Feedback from manager" value={ci.feedbackFromManager} />

          <FormField label="Self-rating this month">
            <RatingBadge rating={ci.selfRating} />
          </FormField>

          <FormField label="Progress versus last month">
            <span className="inline-flex text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: progress.bg, color: progress.fg }}>
              {progress.label}
            </span>
          </FormField>

          <FormField label="Support needed?">
            <span className="text-sm font-semibold"
                  style={{ color: ci.supportNeeded ? IBL_PINK : '#15803d' }}>
              {ci.supportNeeded ? 'Yes' : 'No'}
            </span>
          </FormField>

          {ci.supportNeeded && (
            <div className="p-3 rounded-xl border sm:col-span-2"
                 style={{ backgroundColor: '#fff8fb', borderColor: `${IBL_PINK}40` }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                 style={{ color: IBL_PINK }}>Type of support needed</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {ci.typeOfSupportNeeded || '—'}
              </p>
            </div>
          )}
        </div>

        {/* Section 5 – Looking Forward */}
        <FormDivider title="Looking Forward" />
        <div className="space-y-3">
          {ci.focusForNext30Days ? (
            <div className="p-4 rounded-xl border-l-4"
                 style={{ backgroundColor: '#eff6ff', borderLeftColor: IBL_CYAN }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1 text-blue-700">
                Focus for next 30 days
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">{ci.focusForNext30Days}</p>
            </div>
          ) : (
            <TextField label="Focus for next 30 days" value="" />
          )}
          <FormField label="Next check-in date">
            {ci.nextCheckInDate ? (
              <span className="text-sm font-semibold text-gray-800">
                {new Date(ci.nextCheckInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            ) : (
              <p className="text-sm text-gray-300 italic">—</p>
            )}
          </FormField>
        </div>

      </div>
    </div>
  );
}

// ── Leader row in the progress matrix ────────────────────────────────────────

function LeaderRow({
  leader,
  sp,
  checkIns,
  biWeeklyCheckIns = [],
}: {
  leader: ReturnType<typeof getLeader> & object;
  sp: StartingPoint | undefined;
  checkIns: CheckIn[];
  biWeeklyCheckIns?: BiWeeklyCheckIn[];
}) {
  const sortedCI = [...checkIns].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  const sortedBW = [...biWeeklyCheckIns].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const latestCI = sortedCI[sortedCI.length - 1];
  const latestBW = sortedBW[sortedBW.length - 1];

  // Pick the most recent record across both types for Last Progress / Next Check-In / Support
  const latestDate = (r: { date: string; type: 'ci' | 'bw' } | null, cand: string, type: 'ci' | 'bw') =>
    !r || new Date(cand) > new Date(r.date) ? { date: cand, type } : r;
  let latestRef: { date: string; type: 'ci' | 'bw' } | null = null;
  if (latestCI) latestRef = latestDate(latestRef, latestCI.submittedAt, 'ci');
  if (latestBW) latestRef = latestDate(latestRef, latestBW.createdAt, 'bw');

  // Avg rating — combine both
  const allRatings = [
    ...checkIns.map(c => c.selfRating),
    ...biWeeklyCheckIns.map(b => b.selfRating),
  ].filter(r => r > 0);
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  // Support — either type flags it
  const needsSupport = (latestRef?.type === 'ci' ? latestCI?.supportNeeded : latestBW?.supportNeeded) ?? false;

  // Principles — union of both types
  const principles = [...new Set([
    ...checkIns.map(c => c.selectedPrinciple),
    ...biWeeklyCheckIns.map(b => b.principleFocus),
  ].filter(Boolean))];

  // Next check-in — most recent nextCheckInDate from either type
  const nextCheckInDate = [latestCI?.nextCheckInDate, latestBW?.nextCheckInDate]
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] ?? null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                     ${needsSupport ? 'border border-pink-200' : 'border border-transparent hover:bg-slate-50'}`}
         style={needsSupport ? { backgroundColor: '#fff8fb' } : {}}>

      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold
                      text-xs flex-shrink-0"
           style={{ backgroundColor: IBL_NAVY }}>
        {leader.initials}
      </div>

      <div className="w-28 flex-shrink-0 min-w-0">
        <p className="font-bold text-sm text-gray-900 truncate">{leader.name}</p>
        <p className="text-xs text-gray-400 truncate">{sp?.team ?? '—'}</p>
      </div>

      <div className="w-24 flex-shrink-0">
        {sp ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>✓ Done</span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
            Pending
          </span>
        )}
      </div>

      <div className="w-20 flex-shrink-0 text-center">
        <p className="text-xl font-extrabold" style={{ color: IBL_NAVY }}>{checkIns.length + biWeeklyCheckIns.length}</p>
        <p className="text-xs text-gray-400 leading-none">check-in{(checkIns.length + biWeeklyCheckIns.length) !== 1 ? 's' : ''}</p>
      </div>

      <div className="w-20 flex-shrink-0 text-center">
        {avgRating ? (
          <>
            <p className="text-xl font-extrabold" style={{ color: IBL_CYAN }}>{avgRating}</p>
            <p className="text-xs text-gray-400 leading-none">avg / 5</p>
          </>
        ) : <span className="text-xs text-gray-300">—</span>}
      </div>

      <div className="w-36 flex-shrink-0">
        {latestRef?.type === 'ci' && latestCI ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: PROGRESS_CONFIG[latestCI.progressVersusLastMonth].bg,
                         color: PROGRESS_CONFIG[latestCI.progressVersusLastMonth].fg }}>
            {PROGRESS_CONFIG[latestCI.progressVersusLastMonth].label}
          </span>
        ) : latestRef?.type === 'bw' && latestBW ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: BW_STATUS_CONFIG[latestBW.status].bg,
                         color: BW_STATUS_CONFIG[latestBW.status].fg }}>
            {BW_STATUS_CONFIG[latestBW.status].label}
          </span>
        ) : <span className="text-xs text-gray-300">No check-ins</span>}
      </div>

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

      {/* Next check-in date */}
      <div className="w-32 flex-shrink-0">
        {nextCheckInDate ? (
          <div>
            <p className="text-xs font-semibold text-gray-800">
              {new Date(nextCheckInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {(() => {
              const days = Math.ceil((new Date(nextCheckInDate).getTime() - Date.now()) / 86400000);
              if (days < 0) return <p className="text-xs font-semibold" style={{ color: IBL_PINK }}>Overdue</p>;
              if (days === 0) return <p className="text-xs font-semibold" style={{ color: '#d97706' }}>Today</p>;
              if (days <= 7) return <p className="text-xs" style={{ color: '#d97706' }}>In {days}d</p>;
              return <p className="text-xs text-gray-400">In {days}d</p>;
            })()}
          </div>
        ) : <span className="text-xs text-gray-300">—</span>}
      </div>

      <div className="w-24 flex-shrink-0 text-right">
        {needsSupport ? (
          <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>⚠ Support</span>
        ) : <span className="text-gray-200 text-sm">—</span>}
      </div>
    </div>
  );
}

// ── Per-leader bi-weekly panel ────────────────────────────────────────────────

function LeaderBiWeeklyPanel({
  leader,
  sp,
  bwCheckIns,
}: {
  leader: { id: string; name: string; initials: string };
  sp: StartingPoint | undefined;
  bwCheckIns: BiWeeklyCheckIn[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sorted = [...bwCheckIns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sorted.length === 0) return null;

  const ratings = sorted.map(b => b.selfRating).filter(r => r > 0);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  const latest = sorted[0];
  const latestStatus = BW_STATUS_CONFIG[latest?.status] ?? BW_STATUS_CONFIG['progressing'];
  const sparklineRatings = [...sorted].reverse().map(b => b.selfRating).filter(r => r > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Leader header (click to collapse) ── */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white
                        font-bold text-sm flex-shrink-0"
             style={{ backgroundColor: IBL_NAVY }}>
          {leader.initials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{leader.name}</p>
          <p className="text-xs text-gray-400">{sp?.team ?? '—'}</p>
        </div>

        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="text-center">
            <p className="text-lg font-extrabold leading-none" style={{ color: IBL_NAVY }}>
              {sorted.length}
            </p>
            <p className="text-xs text-gray-400">check-in{sorted.length !== 1 ? 's' : ''}</p>
          </div>
          {avgRating && (
            <div className="text-center">
              <p className="text-lg font-extrabold leading-none" style={{ color: IBL_CYAN }}>
                {avgRating}
              </p>
              <p className="text-xs text-gray-400">avg / 5</p>
            </div>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:inline"
                style={{ backgroundColor: latestStatus.bg, color: latestStatus.fg }}>
            {latestStatus.label}
          </span>
          <Sparkline ratings={sparklineRatings} />
          <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── Check-in table ── */}
      {expanded && (
        <div className="border-t border-gray-100">

          {/* Column headers */}
          <div className="hidden sm:flex items-center gap-2 px-5 py-2 bg-slate-50 border-b border-gray-100
                          text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div className="w-14 flex-shrink-0">Week</div>
            <div className="w-24 flex-shrink-0">Date</div>
            <div className="w-32 flex-shrink-0">Principle</div>
            <div className="w-28 flex-shrink-0">Status</div>
            <div className="w-16 flex-shrink-0 text-center">Rating</div>
            <div className="w-20 flex-shrink-0 text-center">Confidence</div>
            <div className="flex-1">Key Actions</div>
            <div className="w-20 flex-shrink-0 text-right">Support</div>
            <div className="w-6 flex-shrink-0" />
          </div>

          {sorted.map((bw, idx) => {
            const principle  = getPrinciple(bw.principleFocus);
            const status     = BW_STATUS_CONFIG[bw.status] ?? BW_STATUS_CONFIG['progressing'];
            const ratingC    = RATING_COLORS[bw.selfRating] ?? { bg: '#f3f4f6', fg: '#6b7280' };
            const confC      = RATING_COLORS[bw.confidenceLevel] ?? { bg: '#f3f4f6', fg: '#6b7280' };
            const isOpen     = expandedRow === bw.id;

            return (
              <div key={bw.id} className={idx % 2 === 1 ? 'bg-slate-50/40' : ''}>

                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => setExpandedRow(isOpen ? null : bw.id)}
                  className="w-full flex items-center gap-2 px-5 py-3 hover:bg-blue-50/30
                             transition-colors text-left border-b border-gray-50"
                >
                  <div className="w-14 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: IBL_NAVY }}>Wk {bw.week}</span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-xs text-gray-400">
                    {formatDate(bw.createdAt)}
                  </div>
                  <div className="w-32 flex-shrink-0">
                    {principle ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                        P{principle.number} {principle.shortTitle}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                  <div className="w-28 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: status.bg, color: status.fg }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="w-16 flex-shrink-0 text-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: ratingC.bg, color: ratingC.fg }}>
                      {bw.selfRating || '—'}/5
                    </span>
                  </div>
                  <div className="w-20 flex-shrink-0 text-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: confC.bg, color: confC.fg }}>
                      {bw.confidenceLevel || '—'}/5
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{bw.keyActionsTaken || '—'}</p>
                  </div>
                  <div className="w-20 flex-shrink-0 text-right">
                    {bw.supportNeeded
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>⚠ Yes</span>
                      : <span className="text-xs text-gray-200">—</span>}
                  </div>
                  <div className="w-6 flex-shrink-0 text-gray-300 text-xs text-right">
                    {isOpen ? '▲' : '▼'}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 py-4 border-b border-gray-100 space-y-4"
                       style={{ backgroundColor: '#f8faff' }}>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormDivider title="Weekly Progress" />
                      <div className="sm:col-span-2" />
                      <TextField label="Key actions taken"    value={bw.keyActionsTaken} />
                      <TextField label="What went well"       value={bw.whatWentWell} />
                      <TextField label="Challenges"           value={bw.challenges} />
                      {bw.supportNeeded && (
                        <div className="p-3 rounded-xl border sm:col-span-2"
                             style={{ backgroundColor: '#fff8fb', borderColor: `${IBL_PINK}40` }}>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                             style={{ color: IBL_PINK }}>Support needed</p>
                          <p className="text-sm text-gray-800">{bw.typeOfSupportNeeded || '—'}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormDivider title="Principle Focus" />
                      <div className="sm:col-span-2" />
                      <TextField label="Why this principle"       value={bw.whyThisPrinciple} />
                      <TextField label="Behaviours to practice"   value={bw.behavioursTopractice} />
                      <TextField label="Success measure"          value={bw.successMeasure} />
                      <TextField label="Accountability partner"   value={bw.accountabilityPartner} />
                      {bw.overallProgressComment && (
                        <TextField label="Overall progress comment" value={bw.overallProgressComment} />
                      )}
                    </div>

                    {(bw.whatDidWell || bw.whereFellShort || bw.concreteExample || bw.mainObstacle ||
                      bw.feedbackFromTeam || bw.feedbackFromManager || bw.focusNextMonth) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormDivider title="Monthly Reflection" />
                        <div className="sm:col-span-2" />
                        <TextField label="What I did well"        value={bw.whatDidWell} />
                        <TextField label="Where I fell short"     value={bw.whereFellShort} />
                        <TextField label="Concrete example"       value={bw.concreteExample} />
                        <TextField label="Main obstacle"          value={bw.mainObstacle} />
                        <TextField label="Feedback from team"     value={bw.feedbackFromTeam} />
                        <TextField label="Feedback from manager"  value={bw.feedbackFromManager} />
                        {bw.focusNextMonth && (
                          <div className="p-3 rounded-xl border-l-4 sm:col-span-2"
                               style={{ backgroundColor: '#eff6ff', borderLeftColor: IBL_CYAN }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-1 text-blue-700">
                              Focus for next month
                            </p>
                            <p className="text-sm text-gray-800">{bw.focusNextMonth}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {bw.nextCheckInDate && (
                      <p className="text-xs text-gray-400">
                        Next check-in:{' '}
                        <span className="font-semibold text-gray-700">
                          {new Date(bw.nextCheckInDate).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { data } = useStore();

  // ── Overview stats ──────────────────────────────────────────────────────────
  const completedReflections = LEADERS.filter(l =>
    data.startingPoints.some(s => s.leaderId === l.id),
  ).length;
  const totalCheckIns = data.checkIns.length + data.biWeeklyCheckIns.length;
  const allRatings = [
    ...data.checkIns.map(c => c.selfRating),
    ...data.biWeeklyCheckIns.map(b => b.selfRating),
  ].filter(r => r > 0);
  const avgRating = allRatings.length
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : '—';
  const supportCount =
    data.checkIns.filter(c => c.supportNeeded).length +
    data.biWeeklyCheckIns.filter(b => b.supportNeeded).length;
  const improvedCount =
    data.checkIns.filter(c => c.progressVersusLastMonth === 'improved').length +
    data.biWeeklyCheckIns.filter(b => b.status === 'on-track').length;

  // ── Principle distribution ──────────────────────────────────────────────────
  const principleCounts = PRINCIPLES.map(p => ({
    principle: p,
    count:
      data.checkIns.filter(c => c.selectedPrinciple === p.id).length +
      data.biWeeklyCheckIns.filter(b => b.principleFocus === p.id).length,
  }));

  // ── Support alerts ──────────────────────────────────────────────────────────
  type SupportAlert = { id: string; leaderId: string; date: string; principle: string; support: string };
  const supportAlerts: SupportAlert[] = [
    ...data.checkIns.filter(c => c.supportNeeded).map(c => ({
      id: c.id, leaderId: c.leaderId, date: c.submittedAt,
      principle: c.selectedPrinciple, support: c.typeOfSupportNeeded,
    })),
    ...data.biWeeklyCheckIns.filter(b => b.supportNeeded).map(b => ({
      id: b.id, leaderId: b.leaderId, date: b.createdAt,
      principle: b.principleFocus, support: b.typeOfSupportNeeded,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">
            Full visibility into every pioneer's progress across the 6 leadership principles
          </p>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/bi-weekly"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bi-Weekly Check-Ins
            </Link>
            <ExportButton
              label="Export Excel"
              icon="📊"
              onClick={() => exportToExcel(data)}
            />
            <ExportButton
              label="Export PowerPoint"
              icon="📑"
              onClick={() => exportToPowerPoint(data)}
            />
          </div>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />
      </div>

      {/* ── Overview stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {([
          { label: 'Pioneers',        value: LEADERS.length,       sub: 'total',          color: IBL_NAVY  },
          { label: 'Reflections',     value: completedReflections, sub: 'completed',       color: '#15803d' },
          { label: 'Check-Ins',       value: totalCheckIns,        sub: 'submitted',       color: IBL_CYAN  },
          { label: 'Avg Self-Rating', value: avgRating,            sub: 'out of 5',        color: '#1d4ed8' },
          { label: 'Support Flags',   value: supportCount,         sub: 'need attention',  color: '#be185d' },
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
            {supportAlerts.map(alert => {
              const leader    = getLeader(alert.leaderId);
              const principle = getPrinciple(alert.principle);
              return (
                <div key={alert.id}
                     className="flex items-start gap-3 p-4 rounded-xl border"
                     style={{ backgroundColor: '#fff8fb', borderColor: `${IBL_PINK}30` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white
                                  font-bold text-sm flex-shrink-0"
                       style={{ backgroundColor: IBL_NAVY }}>
                    {leader?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{leader?.name}</p>
                    {principle && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        P{principle.number} — {principle.shortTitle}
                      </p>
                    )}
                    {alert.support && (
                      <p className="text-sm text-gray-800 mt-2 p-2 rounded-lg"
                         style={{ backgroundColor: '#fff0f7' }}>
                        "{alert.support}"
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(alert.date)}</span>
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

        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-gray-100
                        text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div className="w-9 flex-shrink-0" />
          <div className="w-28 flex-shrink-0">Leader</div>
          <div className="w-24 flex-shrink-0">Reflection</div>
          <div className="w-20 flex-shrink-0 text-center">Check-Ins</div>
          <div className="w-20 flex-shrink-0 text-center">Avg Rating</div>
          <div className="w-36 flex-shrink-0">Last Progress</div>
          <div className="flex-1">Principles Covered</div>
          <div className="w-32 flex-shrink-0">Next Check-In</div>
          <div className="w-24 flex-shrink-0 text-right">Support</div>
        </div>

        <div className="p-3 space-y-1">
          {LEADERS.map(leader => {
            const sp             = data.startingPoints.find(s => s.leaderId === leader.id);
            const checkIns       = data.checkIns.filter(c => c.leaderId === leader.id);
            const biWeeklyCheckIns = data.biWeeklyCheckIns.filter(b => b.leaderId === leader.id);
            return <LeaderRow key={leader.id} leader={leader} sp={sp} checkIns={checkIns} biWeeklyCheckIns={biWeeklyCheckIns} />;
          })}
        </div>
      </div>

      {/* ── Bi-Weekly Check-In Tracker ──────────────────────────────────────── */}
      {data.biWeeklyCheckIns.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bi-Weekly Check-In Tracker</h2>
            <p className="text-xs text-gray-400 mt-0.5">Per-leader history — click a row to expand full details</p>
          </div>
          {LEADERS.map(leader => {
            const sp = data.startingPoints.find(s => s.leaderId === leader.id);
            const bwCheckIns = data.biWeeklyCheckIns.filter(b => b.leaderId === leader.id);
            return (
              <LeaderBiWeeklyPanel key={leader.id} leader={leader} sp={sp} bwCheckIns={bwCheckIns} />
            );
          })}
        </div>
      )}

      {/* ── Principle Focus Distribution ─────────────────────────────────────── */}
      {totalCheckIns > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Principle Focus Distribution</h2>
          <p className="text-xs text-gray-400 mb-5">
            How often each principle has been selected across all check-ins
            {improvedCount > 0 && ` · ${improvedCount} of ${totalCheckIns} check-ins show improvement`}
          </p>
          <div className="space-y-3">
            {principleCounts.map(({ principle: p, count }) => {
              const pct = totalCheckIns > 0 ? (count / totalCheckIns) * 100 : 0;
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


    </div>
  );
}
