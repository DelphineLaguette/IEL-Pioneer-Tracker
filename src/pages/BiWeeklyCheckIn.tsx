import { useState, FormEvent } from 'react';
import { useStore } from '../context/StoreContext';
import { getLatestSP } from '../context/StoreContext';
import { LEADERS, getLeader } from '../data/leaders';
import { PRINCIPLES, getPrinciple } from '../data/principles';
import type { BiWeeklyCheckIn } from '../types';

const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';
const IBL_PINK  = '#FF51A1';

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Low — feeling stuck',
  2: 'Some doubt, needs support',
  3: 'Moderate — making progress',
  4: 'Good — on track',
  5: 'High — fully confident',
};

const STATUS_CONFIG = {
  'on-track':         { label: 'On Track',        bg: '#dcfce7', fg: '#15803d' },
  'progressing':      { label: 'Progressing',      bg: '#fef9c3', fg: '#a16207' },
  'needs-attention':  { label: 'Needs Attention',  bg: '#fee2e2', fg: '#b91c1c' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Reusable UI ────────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent resize-none"
    />
  );
}

function RatingButtons({ value, onChange, labels }: {
  value: number; onChange: (n: number) => void; labels: Record<number, string>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
                  className="w-10 h-10 rounded-full font-bold text-sm transition-all flex-shrink-0"
                  style={value === n
                    ? { backgroundColor: IBL_NAVY, color: '#fff', transform: 'scale(1.1)' }
                    : { backgroundColor: '#f3f4f6', color: '#4b5563' }}>
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs font-medium" style={{ color: IBL_CYAN }}>{labels[value]}</p>
      )}
    </div>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
           style={{ backgroundColor: IBL_NAVY }}>
        {number}
      </div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

// ── Leader status card ────────────────────────────────────────────────────────

function LeaderCard({
  leaderId,
  checkIns,
  onRecord,
}: {
  leaderId: string;
  checkIns: BiWeeklyCheckIn[];
  onRecord: (id: string) => void;
}) {
  const leader = getLeader(leaderId)!;
  const sorted = [...checkIns]
    .filter(c => c.leaderId === leaderId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latest = sorted[0];

  const nextDate = latest?.nextCheckInDate;
  const daysUntil = nextDate
    ? Math.ceil((new Date(nextDate).getTime() - Date.now()) / 86400000)
    : null;

  let countdownColor = '#6b7280';
  let countdownText = nextDate ? `In ${daysUntil}d` : 'Not scheduled';
  if (daysUntil !== null) {
    if (daysUntil < 0)  { countdownColor = IBL_PINK;  countdownText = 'Overdue'; }
    else if (daysUntil === 0) { countdownColor = '#d97706'; countdownText = 'Today'; }
    else if (daysUntil <= 3)  { countdownColor = '#d97706'; countdownText = `In ${daysUntil}d`; }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
           style={{ backgroundColor: IBL_NAVY }}>
        {leader.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{leader.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {sorted.length} check-in{sorted.length !== 1 ? 's' : ''}
          {latest && ` · last ${formatDate(latest.createdAt)}`}
        </p>
        {nextDate && (
          <p className="text-xs font-semibold mt-0.5" style={{ color: countdownColor }}>
            Next: {formatDate(nextDate)} — {countdownText}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRecord(leaderId)}
        className="px-3 py-1.5 text-xs font-bold rounded-lg flex-shrink-0 transition-all hover:opacity-90"
        style={{ backgroundColor: IBL_CYAN, color: IBL_NAVY }}
      >
        + Record
      </button>
    </div>
  );
}

// ── History card ──────────────────────────────────────────────────────────────

function HistoryCard({ bw }: { bw: BiWeeklyCheckIn }) {
  const [open, setOpen] = useState(false);
  const leader    = getLeader(bw.leaderId);
  const principle = getPrinciple(bw.principleFocus);
  const status    = STATUS_CONFIG[bw.status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
              className="w-full text-left hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
               style={{ backgroundColor: IBL_NAVY }}>
            {leader?.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{leader?.name}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-500">Week {bw.week}</span>
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
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(bw.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: status.bg, color: status.fg }}>
              {status.label}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
              Self {bw.selfRating}/5
            </span>
            {bw.supportNeeded && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#fff0f7', color: IBL_PINK }}>
                ⚠
              </span>
            )}
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Part 1 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: IBL_NAVY }}>
              Weekly Progress — Week {bw.week}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Key actions taken',  value: bw.keyActionsTaken },
                { label: 'What went well',     value: bw.whatWentWell },
                { label: 'Challenges',         value: bw.challenges },
              ].map(({ label, value }) => value ? (
                <div key={label} className="p-3 rounded-xl bg-slate-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
                </div>
              ) : null)}
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Confidence level</p>
                <p className="text-sm font-bold" style={{ color: IBL_NAVY }}>
                  {bw.confidenceLevel}/5 — {CONFIDENCE_LABELS[bw.confidenceLevel]}
                </p>
              </div>
              {bw.supportNeeded && bw.typeOfSupportNeeded && (
                <div className="p-3 rounded-xl sm:col-span-2"
                     style={{ backgroundColor: '#fff8fb', border: `1px solid ${IBL_PINK}40` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: IBL_PINK }}>Support needed</p>
                  <p className="text-sm text-gray-800">{bw.typeOfSupportNeeded}</p>
                </div>
              )}
            </div>
          </div>
          {/* Part 2 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: IBL_NAVY }}>
              Principle Focus
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Principle</p>
                <p className="text-sm font-semibold text-gray-800">
                  {principle ? `P${principle.number} — ${principle.shortTitle}` : bw.principleFocus || '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
                      style={{ backgroundColor: status.bg, color: status.fg }}>
                  {status.label}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Self rating</p>
                <p className="text-lg font-extrabold" style={{ color: IBL_NAVY }}>{bw.selfRating}/5</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Manager rating</p>
                <p className="text-lg font-extrabold" style={{ color: IBL_CYAN }}>{bw.managerRating > 0 ? `${bw.managerRating}/5` : '—'}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Why this principle this month?', value: bw.whyThisPrinciple },
                { label: '3 behaviours I will practice',  value: bw.behavioursTopractice },
                { label: 'Success measure',               value: bw.successMeasure },
                { label: 'Accountability partner',        value: bw.accountabilityPartner },
              ].map(({ label, value }) => value ? (
                <div key={label} className="p-3 rounded-xl bg-slate-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
                </div>
              ) : null)}
            </div>
            {bw.overallProgressComment && (
              <div className="mt-3 p-3 rounded-xl border-l-4"
                   style={{ backgroundColor: '#eff6ff', borderLeftColor: IBL_CYAN }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1 text-blue-700">
                  Overall progress comment
                </p>
                <p className="text-sm text-gray-800">{bw.overallProgressComment}</p>
              </div>
            )}
          </div>
          {/* Part 3 */}
          {(bw.whatDidWell || bw.whereFellShort || bw.concreteExample || bw.mainObstacle || bw.feedbackFromTeam || bw.feedbackFromManager || bw.focusNextMonth) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: IBL_NAVY }}>
                Monthly Reflection
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'What I did well this month', value: bw.whatDidWell },
                  { label: 'Where I fell short',         value: bw.whereFellShort },
                  { label: 'Concrete example',           value: bw.concreteExample },
                  { label: 'Main obstacle',              value: bw.mainObstacle },
                  { label: 'Feedback from team',         value: bw.feedbackFromTeam },
                  { label: 'Feedback from manager',      value: bw.feedbackFromManager },
                  { label: 'Focus for next 30 days',     value: bw.focusNextMonth },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="p-3 rounded-xl bg-slate-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
          {bw.nextCheckInDate && (
            <p className="text-xs text-gray-400">
              Next check-in: <span className="font-semibold text-gray-700">{formatDateLong(bw.nextCheckInDate)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Email helper ──────────────────────────────────────────────────────────────

function sendBiWeeklySummaryEmail(bw: BiWeeklyCheckIn, leaderName: string, leaderEmail: string) {
  const principle = getPrinciple(bw.principleFocus);
  const principleName = principle ? `P${principle.number} — ${principle.title}` : bw.principleFocus || '—';
  const nextDate = bw.nextCheckInDate
    ? new Date(bw.nextCheckInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const subject = encodeURIComponent(`Your Bi-Weekly Check-In Summary — Week ${bw.week}`);
  const body = encodeURIComponent(
    `Dear ${leaderName},\n\n` +
    `Thank you for your bi-weekly check-in (Week ${bw.week}).\n\n` +
    `Here is a summary:\n\n` +
    `──────────────────────────\n` +
    `Principle in focus: ${principleName}\n` +
    `Status: ${bw.status}\n` +
    `Self-rating: ${bw.selfRating}/5\n` +
    `Confidence level: ${bw.confidenceLevel}/5\n` +
    (bw.focusNextMonth ? `Focus for next 30 days:\n${bw.focusNextMonth}\n` : '') +
    `──────────────────────────\n\n` +
    `Next check-in: ${nextDate}\n\n` +
    `Keep up the great work!\n\n` +
    `Best regards,\nIBL Energy — Pioneer Tracker`
  );
  window.open(`mailto:${leaderEmail}?subject=${subject}&body=${body}`, '_blank');
}

// ── Page ─────────────────────────────────────────────────────────────────────

function buildDefault(leaderId: string): Omit<BiWeeklyCheckIn, 'id' | 'createdAt'> {
  return {
    leaderId,
    week: '1',
    keyActionsTaken: '',
    whatWentWell: '',
    challenges: '',
    supportNeeded: false,
    typeOfSupportNeeded: '',
    confidenceLevel: 0,
    principleFocus: '',
    whyThisPrinciple: '',
    behavioursTopractice: '',
    successMeasure: '',
    accountabilityPartner: '',
    status: 'on-track',
    selfRating: 0,
    managerRating: 0,
    overallProgressComment: '',
    whatDidWell: '',
    whereFellShort: '',
    concreteExample: '',
    mainObstacle: '',
    feedbackFromTeam: '',
    feedbackFromManager: '',
    focusNextMonth: '',
    nextCheckInDate: addDays(14),
  };
}

export default function BiWeeklyCheckInPage() {
  const { data, addBiWeeklyCheckIn } = useStore();
  const [showForm, setShowForm]   = useState(false);
  const [filterLeader, setFilter] = useState('');
  const [form, setForm]           = useState(() => buildDefault(''));
  const [savedBW, setSavedBW]     = useState<BiWeeklyCheckIn | null>(null);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function openForm(leaderId: string) {
    setForm(buildDefault(leaderId));
    setShowForm(true);
    setSavedBW(null);
    setTimeout(() => document.getElementById('bw-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const bw: BiWeeklyCheckIn = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    addBiWeeklyCheckIn(bw);
    setSavedBW(bw);
    setShowForm(false);
    setForm(buildDefault(''));
  }

  const filtered = data.biWeeklyCheckIns
    .filter(bw => !filterLeader || bw.leaderId === filterLeader)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const supportFlags = data.biWeeklyCheckIns.filter(b => b.supportNeeded).length;

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <div className="relative rounded-2xl overflow-hidden"
           style={{ background: `linear-gradient(135deg, ${IBL_NAVY} 0%, #001840 55%, #002e80 100%)` }}>
        <div className="absolute rounded-full opacity-10 pointer-events-none"
             style={{ width: 280, height: 280, backgroundColor: IBL_CYAN, top: -70, right: -30 }} />
        <div className="absolute rounded-full opacity-10 pointer-events-none"
             style={{ width: 110, height: 110, backgroundColor: IBL_PINK, bottom: -25, right: 200 }} />
        <div className="relative z-10 p-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Bi-Weekly Culture Check-In</h1>
          <p className="text-sm text-white/60 mt-1">
            Track fortnightly culture conversations and leadership progress with each pioneer
          </p>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: IBL_CYAN }} />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Check-Ins', value: data.biWeeklyCheckIns.length, color: IBL_NAVY },
          { label: 'Support Flags',   value: supportFlags,                  color: IBL_PINK },
          { label: 'Leaders Tracked', value: new Set(data.biWeeklyCheckIns.map(b => b.leaderId)).size, color: IBL_CYAN },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-semibold text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Save confirmation banner ── */}
      {savedBW && (() => {
        const leader = getLeader(savedBW.leaderId);
        const sp = data.startingPoints.find(s => s.leaderId === savedBW.leaderId);
        return (
          <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0"
                 style={{ backgroundColor: IBL_CYAN }}>✓</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">Check-In Saved!</p>
              <p className="text-xs text-gray-500">{leader?.name}'s bi-weekly check-in has been recorded.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => sendBiWeeklySummaryEmail(savedBW, leader?.name ?? '', sp?.email ?? '')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: IBL_NAVY, color: 'white' }}
              >
                ✉ Send Summary
              </button>
              <button type="button" onClick={() => setSavedBW(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl px-2">✕</button>
            </div>
          </div>
        );
      })()}

      {/* ── Leader overview cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Pioneer Check-In Status</h2>
          <button
            type="button"
            onClick={() => openForm('')}
            className="px-4 py-2 text-sm font-bold rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: IBL_NAVY, color: '#fff' }}
          >
            + New Check-In
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEADERS.map(l => (
            <LeaderCard
              key={l.id}
              leaderId={l.id}
              checkIns={data.biWeeklyCheckIns}
              onRecord={openForm}
            />
          ))}
        </div>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div id="bw-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
               style={{ background: `linear-gradient(135deg, ${IBL_NAVY}08 0%, ${IBL_CYAN}12 100%)` }}>
            <div>
              <h2 className="font-bold text-gray-900">Record Bi-Weekly Check-In</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill in both parts below</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">

            {/* Leader + Week */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Leader" required>
                <select
                  value={form.leaderId}
                  onChange={e => set('leaderId', e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#00D0DA]"
                >
                  <option value="">Select leader…</option>
                  {LEADERS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Week">
                <select
                  value={form.week}
                  onChange={e => set('week', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#00D0DA]"
                >
                  {Array.from({ length: 100 }, (_, i) => String(i + 1)).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Part 1 */}
            <div className="space-y-4">
              <SectionHeader number={1} title="Weekly Progress" />
              <Field label="Key actions taken">
                <TextArea value={form.keyActionsTaken} onChange={v => set('keyActionsTaken', v)}
                          placeholder="What leadership actions did the pioneer take this week?" />
              </Field>
              <Field label="What went well">
                <TextArea value={form.whatWentWell} onChange={v => set('whatWentWell', v)}
                          placeholder="Wins and positive moments worth acknowledging…" />
              </Field>
              <Field label="Challenges">
                <TextArea value={form.challenges} onChange={v => set('challenges', v)}
                          placeholder="Obstacles, tensions, or areas where they struggled…" />
              </Field>
              <Field label="Confidence level (1 = low, 5 = high)">
                <RatingButtons value={form.confidenceLevel} onChange={v => set('confidenceLevel', v)}
                               labels={CONFIDENCE_LABELS} />
              </Field>
              <Field label="Support needed?">
                <div className="flex gap-3">
                  {[{ v: true, label: 'Yes' }, { v: false, label: 'No' }].map(opt => (
                    <button key={String(opt.v)} type="button" onClick={() => set('supportNeeded', opt.v)}
                            className="px-6 py-2 rounded-lg border text-sm font-medium transition-all"
                            style={form.supportNeeded === opt.v
                              ? { backgroundColor: IBL_NAVY, color: '#fff', border: `1px solid ${IBL_NAVY}` }
                              : { backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
              {form.supportNeeded && (
                <Field label="Type of support needed">
                  <TextArea value={form.typeOfSupportNeeded} onChange={v => set('typeOfSupportNeeded', v)}
                            placeholder="Describe the support that would help most…" rows={2} />
                </Field>
              )}
            </div>

            {/* Part 2 */}
            <div className="space-y-4">
              <SectionHeader number={2} title="Principle Focus" />
              <Field label="Selected leadership principle">
                <select
                  value={form.principleFocus}
                  onChange={e => set('principleFocus', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#00D0DA]"
                >
                  <option value="">Select principle…</option>
                  {PRINCIPLES.map(p => (
                    <option key={p.id} value={p.id}>P{p.number} — {p.title}</option>
                  ))}
                </select>
              </Field>
              <Field label="Why this principle this month?">
                <TextArea value={form.whyThisPrinciple} onChange={v => set('whyThisPrinciple', v)}
                          placeholder="What makes this principle the right focus right now?" />
              </Field>
              <Field label="3 behaviours I will practice">
                <TextArea value={form.behavioursTopractice} onChange={v => set('behavioursTopractice', v)}
                          placeholder="List the 3 specific behaviours you commit to practising…" />
              </Field>
              <Field label="Success measure">
                <TextArea value={form.successMeasure} onChange={v => set('successMeasure', v)}
                          placeholder="How will you know you've been successful?" rows={2} />
              </Field>
              <Field label="Accountability partner">
                <TextArea value={form.accountabilityPartner} onChange={v => set('accountabilityPartner', v)}
                          placeholder="Who will hold you accountable?" rows={2} />
              </Field>
              <Field label="Status">
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(STATUS_CONFIG) as [BiWeeklyCheckIn['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([val, cfg]) => (
                    <button key={val} type="button" onClick={() => set('status', val)}
                            className="px-4 py-2 rounded-lg border text-sm font-semibold transition-all"
                            style={form.status === val
                              ? { backgroundColor: cfg.bg, color: cfg.fg, border: `1px solid ${cfg.fg}40` }
                              : { backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Self-rating (1–5)">
                  <RatingButtons value={form.selfRating} onChange={v => set('selfRating', v)}
                                 labels={{ 1:'1', 2:'2', 3:'3', 4:'4', 5:'5' }} />
                </Field>
                <Field label="Manager rating (1–5)" hint="Leave at 0 if not yet assessed">
                  <RatingButtons value={form.managerRating} onChange={v => set('managerRating', v)}
                                 labels={{ 1:'1', 2:'2', 3:'3', 4:'4', 5:'5' }} />
                </Field>
              </div>
              <Field label="Overall progress comment">
                <TextArea value={form.overallProgressComment} onChange={v => set('overallProgressComment', v)}
                          placeholder="Summarise the leader's overall progress this fortnight…" />
              </Field>
            </div>

            {/* Part 3 */}
            <div className="space-y-4">
              <SectionHeader number={3} title="Monthly Reflection" />
              <Field label="What I did well this month">
                <TextArea value={form.whatDidWell} onChange={v => set('whatDidWell', v)}
                          placeholder="Achievements and positive moments worth acknowledging…" />
              </Field>
              <Field label="Where I fell short">
                <TextArea value={form.whereFellShort} onChange={v => set('whereFellShort', v)}
                          placeholder="Areas where you didn't meet your own expectations…" />
              </Field>
              <Field label="Concrete example">
                <TextArea value={form.concreteExample} onChange={v => set('concreteExample', v)}
                          placeholder="A specific situation that illustrates your progress or challenge…" />
              </Field>
              <Field label="Main obstacle">
                <TextArea value={form.mainObstacle} onChange={v => set('mainObstacle', v)}
                          placeholder="What got in the way most this month?" rows={2} />
              </Field>
              <Field label="Feedback from team">
                <TextArea value={form.feedbackFromTeam} onChange={v => set('feedbackFromTeam', v)}
                          placeholder="What feedback have you received from your team?" />
              </Field>
              <Field label="Feedback from manager">
                <TextArea value={form.feedbackFromManager} onChange={v => set('feedbackFromManager', v)}
                          placeholder="What feedback have you received from your manager?" />
              </Field>
              <Field label="Focus for next 30 days">
                <TextArea value={form.focusNextMonth} onChange={v => set('focusNextMonth', v)}
                          placeholder="What is your main leadership focus for the next 30 days?" />
              </Field>
              <Field label="Next check-in date">
                <input
                  type="date"
                  value={form.nextCheckInDate}
                  onChange={e => set('nextCheckInDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent"
                />
              </Field>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm
                                 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit"
                      className="flex-1 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
                      style={{ backgroundColor: IBL_NAVY }}>
                Save Check-In
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── History ── */}
      <div>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <h2 className="font-bold text-gray-900 flex-1">Check-In History</h2>
          <select
            value={filterLeader}
            onChange={e => setFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#00D0DA]"
          >
            <option value="">All leaders</option>
            {LEADERS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-gray-400 text-sm">
              {data.biWeeklyCheckIns.length === 0
                ? 'No bi-weekly check-ins recorded yet.'
                : 'No check-ins for this leader yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(bw => <HistoryCard key={bw.id} bw={bw} />)}
          </div>
        )}
      </div>

    </div>
  );
}
