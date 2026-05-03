import { useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getLeader } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import type { CheckIn } from '../types';

function sendCheckInSummaryEmail(ci: CheckIn, leaderName: string) {
  const principle = PRINCIPLES.find(p => p.id === ci.selectedPrinciple);
  const principleName = principle ? `P${principle.number} — ${principle.title}` : ci.selectedPrinciple;
  const nextDate = ci.nextCheckInDate
    ? new Date(ci.nextCheckInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const subject = encodeURIComponent(`Your 30-Day Check-In Summary — ${ci.month}`);
  const body = encodeURIComponent(
    `Dear ${leaderName},\n\n` +
    `Thank you for completing your 30-day check-in for ${ci.month}.\n\n` +
    `Here is a summary of your session:\n\n` +
    `──────────────────────────\n` +
    `Self-rating: ${ci.selfRating}/5\n` +
    `Principle in focus: ${principleName}\n` +
    (ci.focusForNext30Days ? `Focus for next 30 days:\n${ci.focusForNext30Days}\n` : '') +
    `──────────────────────────\n\n` +
    `Next check-in: ${nextDate}\n\n` +
    `Keep up the great work!\n\n` +
    `Best regards,\nIBL Energy — Pioneer Tracker`
  );
  window.open(`mailto:${ci.email}?subject=${subject}&body=${body}`, '_blank');
}

// IBL Energy brand colors
const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';

// ── Reusable inputs ────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent resize-none"
    />
  );
}

const RATING_SCALE_LABELS: Record<number, string> = {
  1: 'Rarely true of me today',
  2: 'Sometimes true, but inconsistent',
  3: 'Often true in my leadership',
  4: 'Strongly present and visible',
  5: 'A clear strength, consistently demonstrated',
};

function RatingButtons({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="w-10 h-10 rounded-full font-bold text-sm transition-all flex-shrink-0"
            style={
              value === n
                ? { backgroundColor: IBL_NAVY, color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,32,96,0.3)', transform: 'scale(1.1)' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
            }
          >
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs font-medium" style={{ color: IBL_CYAN }}>{RATING_SCALE_LABELS[value]}</p>
      )}
    </div>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
        style={{ backgroundColor: IBL_NAVY }}
      >
        {number}
      </div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function buildDefault(email: string, team: string): Omit<CheckIn, 'id' | 'leaderId' | 'submittedAt'> {
  const now = new Date();
  const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return {
    email,
    team,
    month,
    selectedPrinciple: '',
    whyThisPrinciple: '',
    threeBehaviours: '',
    successMeasure: '',
    accountabilityPartner: '',
    whatDidWell: '',
    whereFellShort: '',
    concreteExample: '',
    mainObstacle: '',
    feedbackFromTeam: '',
    feedbackFromManager: '',
    selfRating: 0,
    progressVersusLastMonth: 'same',
    supportNeeded: false,
    typeOfSupportNeeded: '',
    focusForNext30Days: '',
    nextCheckInDate: '',
  };
}

export default function CheckInForm() {
  const { leaderId } = useParams<{ leaderId: string }>();
  const navigate = useNavigate();
  const { data, addCheckIn } = useStore();

  const leader = getLeader(leaderId ?? '');
  const sp = data.startingPoints.find(s => s.leaderId === leaderId);
  const [form, setForm] = useState(() => buildDefault(sp?.email ?? '', sp?.team ?? ''));
  const [savedCI, setSavedCI] = useState<CheckIn | null>(null);

  if (!leader) {
    return <p className="text-gray-500">Leader not found.</p>;
  }

  if (!sp) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Please complete the starting reflection before adding a check-in.</p>
        <button
          onClick={() => navigate(`/leaders/${leader.id}/starting-point`)}
          className="px-4 py-2 text-white text-sm font-medium rounded-lg"
          style={{ backgroundColor: IBL_NAVY }}
        >
          Complete Reflection
        </button>
      </div>
    );
  }

  if (savedCI) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"
            style={{ backgroundColor: IBL_CYAN }}
          >
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check-In Saved!</h2>
          <p className="text-sm text-gray-500 mb-6">
            {leader.name}'s 30-day check-in for <strong>{savedCI.month}</strong> has been recorded.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {savedCI.email && (
              <button
                type="button"
                onClick={() => sendCheckInSummaryEmail(savedCI, leader.name)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: IBL_NAVY, color: 'white' }}
              >
                ✉ Send Summary Email
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(`/leaders/${leader.id}`)}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Back to Leader
            </button>
          </div>
        </div>
      </div>
    );
  }

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ci: CheckIn = {
      ...form,
      id: crypto.randomUUID(),
      leaderId: leader!.id,
      submittedAt: new Date().toISOString(),
    };
    addCheckIn(ci);
    setSavedCI(ci);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: IBL_NAVY }}
          >
            {leader.initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">30-Day Leadership Check-In</h1>
            <p className="text-sm text-gray-500">{leader.name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          This is your space to reflect on how you've grown, celebrate your achievements, and clarify what you want to strengthen next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: About This Month ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={1} title="About This Month" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium">Leader</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{leader.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium">Team</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{sp.team}</p>
              </div>
            </div>
            <Field label="Email">
              <TextInput value={form.email} onChange={v => set('email', v)} placeholder="your@email.com" />
            </Field>
            <Field label="Month" required>
              <TextInput value={form.month} onChange={v => set('month', v)} placeholder="e.g. April 2026" />
            </Field>
          </div>
        </div>

        {/* ── Section 2: This Month's Focus ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={2} title="This Month's Focus" />
          <div className="space-y-4">
            <Field label="Selected leadership principle" required>
              <select
                value={form.selectedPrinciple}
                onChange={e => set('selectedPrinciple', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent bg-white"
              >
                <option value="">Select a principle...</option>
                {PRINCIPLES.map(p => (
                  <option key={p.id} value={p.id}>
                    P{p.number} — {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Why this principle this month?">
              <TextArea
                value={form.whyThisPrinciple}
                onChange={v => set('whyThisPrinciple', v)}
                placeholder="What made you choose to focus on this principle right now?"
              />
            </Field>
            <Field label="3 behaviours I will practice">
              <TextArea
                value={form.threeBehaviours}
                onChange={v => set('threeBehaviours', v)}
                placeholder="List the three specific behaviours you committed to practising..."
                rows={4}
              />
            </Field>
            <Field label="Success measure">
              <TextArea
                value={form.successMeasure}
                onChange={v => set('successMeasure', v)}
                placeholder="How will you know you've been successful? What will you observe?"
                rows={2}
              />
            </Field>
            <Field label="Accountability partner">
              <TextInput
                value={form.accountabilityPartner}
                onChange={v => set('accountabilityPartner', v)}
                placeholder="Who will hold you accountable?"
              />
            </Field>
          </div>
        </div>

        {/* ── Section 3: Reflection on This Month ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={3} title="Reflection on This Month" />
          <div className="space-y-4">
            <Field label="What I did well this month">
              <TextArea
                value={form.whatDidWell}
                onChange={v => set('whatDidWell', v)}
                placeholder="Celebrate your achievements, however small..."
              />
            </Field>
            <Field label="Where I fell short">
              <TextArea
                value={form.whereFellShort}
                onChange={v => set('whereFellShort', v)}
                placeholder="Be honest about the gaps between intention and action..."
              />
            </Field>
            <Field label="Concrete example">
              <TextArea
                value={form.concreteExample}
                onChange={v => set('concreteExample', v)}
                placeholder="Describe a specific situation that illustrates your leadership this month..."
              />
            </Field>
            <Field label="Main obstacle">
              <TextArea
                value={form.mainObstacle}
                onChange={v => set('mainObstacle', v)}
                placeholder="What got in the way of your development this month?"
                rows={2}
              />
            </Field>
          </div>
        </div>

        {/* ── Section 4: Feedback & Progress ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={4} title="Feedback & Progress" />
          <div className="space-y-5">
            <Field label="Feedback from team">
              <TextArea
                value={form.feedbackFromTeam}
                onChange={v => set('feedbackFromTeam', v)}
                placeholder="What feedback, formal or informal, have you received from your team?"
              />
            </Field>
            <Field label="Feedback from manager">
              <TextArea
                value={form.feedbackFromManager}
                onChange={v => set('feedbackFromManager', v)}
                placeholder="What feedback have you received from your manager?"
              />
            </Field>
            <Field label="Self-rating this month" hint="How would you rate yourself on the selected principle this month?">
              <RatingButtons value={form.selfRating} onChange={v => set('selfRating', v)} />
            </Field>
            <Field label="Progress versus last month">
              <div className="flex gap-3">
                {[
                  { value: 'improved', label: '↑ Improved', colors: 'bg-green-50 border-green-300 text-green-700' },
                  { value: 'same',     label: '→ About the same', colors: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
                  { value: 'declined', label: '↓ Need to improve', colors: 'bg-red-50 border-red-300 text-red-700' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('progressVersusLastMonth', opt.value as CheckIn['progressVersusLastMonth'])}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      form.progressVersusLastMonth === opt.value
                        ? opt.colors + ' ring-2 ring-offset-1 ring-[#00D0DA]'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Support needed */}
            <Field label="Support needed?">
              <div className="flex gap-3">
                {[
                  { value: true,  label: 'Yes' },
                  { value: false, label: 'No' },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => set('supportNeeded', opt.value)}
                    className={`px-6 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.supportNeeded === opt.value
                        ? 'border-transparent text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                    style={form.supportNeeded === opt.value ? { backgroundColor: IBL_NAVY } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {form.supportNeeded && (
              <Field label="Type of support needed">
                <TextArea
                  value={form.typeOfSupportNeeded}
                  onChange={v => set('typeOfSupportNeeded', v)}
                  placeholder="Describe the support that would help you most..."
                  rows={2}
                />
              </Field>
            )}
          </div>
        </div>

        {/* ── Section 5: Looking Forward ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={5} title="Looking Forward" />
          <div className="space-y-4">
            <Field label="Focus for next 30 days">
              <TextArea
                value={form.focusForNext30Days}
                onChange={v => set('focusForNext30Days', v)}
                placeholder="What will you focus on in the next 30 days? Which principle, which behaviours?"
                rows={4}
              />
            </Field>
            <Field label="Next check-in date">
              <input
                type="date"
                value={form.nextCheckInDate}
                onChange={e => set('nextCheckInDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent"
              />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: IBL_NAVY }}
          >
            Submit Check-In
          </button>
        </div>
      </form>
    </div>
  );
}
