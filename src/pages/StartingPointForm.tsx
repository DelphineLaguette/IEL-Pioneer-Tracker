import { useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { getLeader } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import type { StartingPoint, PrincipleKey, PrincipleRating } from '../types';

// IBL Energy brand colors
const IBL_NAVY = '#002060';
const IBL_CYAN  = '#00D0DA';

// ── Reusable inputs ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
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

const PERCEPTION_SCALE_LABELS: Record<number, string> = {
  1: 'Not at all',
  2: 'Slightly',
  3: 'Moderately',
  4: 'Quite well',
  5: 'Completely',
};

function RatingButtons({ value, onChange, scaleLabels }: { value: number; onChange: (n: number) => void; scaleLabels: Record<number, string> }) {
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
        <p className="text-xs font-medium" style={{ color: IBL_CYAN }}>{scaleLabels[value]}</p>
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

// ── Default form state ────────────────────────────────────────────────────────

function emptyPrinciple(): PrincipleRating {
  return { rating: 0, evidence: '' };
}

function buildDefault(existing?: StartingPoint): Omit<StartingPoint, 'id' | 'leaderId' | 'submittedAt'> {
  return {
    email: existing?.email ?? '',
    team: existing?.team ?? '',
    leadershipQualities: existing?.leadershipQualities ?? '',
    behavioursAdmired: existing?.behavioursAdmired ?? '',
    teamClearOnDirection: existing?.teamClearOnDirection ?? 0,
    teamUnderstandsPurpose: existing?.teamUnderstandsPurpose ?? 0,
    teamTreatedFairly: existing?.teamTreatedFairly ?? 0,
    teamEncouraged: existing?.teamEncouraged ?? 0,
    teamSafeToShare: existing?.teamSafeToShare ?? 0,
    teamTrustsWord: existing?.teamTrustsWord ?? 0,
    oneThingTeamShouldFeel: existing?.oneThingTeamShouldFeel ?? '',
    leadWithPurpose: existing?.leadWithPurpose ?? emptyPrinciple(),
    roleModelValues: existing?.roleModelValues ?? emptyPrinciple(),
    setHighStandards: existing?.setHighStandards ?? emptyPrinciple(),
    enableInnovation: existing?.enableInnovation ?? emptyPrinciple(),
    actWithResponsibility: existing?.actWithResponsibility ?? emptyPrinciple(),
    buildTrust: existing?.buildTrust ?? emptyPrinciple(),
    strongestPrinciple: existing?.strongestPrinciple ?? '',
    mainDevelopmentArea: existing?.mainDevelopmentArea ?? '',
    whyDevelopmentAreaMatters: existing?.whyDevelopmentAreaMatters ?? '',
    leadershipIntention: existing?.leadershipIntention ?? '',
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StartingPointForm() {
  const { leaderId } = useParams<{ leaderId: string }>();
  const navigate = useNavigate();
  const { data, saveStartingPoint } = useStore();

  const leader = getLeader(leaderId ?? '');
  const existing = data.startingPoints.find(s => s.leaderId === leaderId);
  const [form, setForm] = useState(() => buildDefault(existing));

  if (!leader) {
    return <p className="text-gray-500">Leader not found.</p>;
  }

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setPrinciple(key: PrincipleKey, field: keyof PrincipleRating, value: string | number) {
    setForm(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!leader) return;
    const sp: StartingPoint = {
      ...form,
      id: existing?.id ?? crypto.randomUUID(),
      leaderId: leader.id,
      submittedAt: new Date().toISOString(),
    };
    saveStartingPoint(sp);
    navigate(`/leaders/${leader.id}`);
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
            <h1 className="text-xl font-bold text-gray-900">Leadership Reflection – Starting Point</h1>
            <p className="text-sm text-gray-500">{leader.name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          This reflection is designed to help you step back and assess your leadership today. It combines personal reflection,
          team perception, and a self-assessment across the 6 leadership principles.
        </p>
        {existing && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            You have an existing reflection. Submitting this form will update it.
          </div>
        )}
      </div>

      {/* Scale legend */}
      <div className="mb-6 p-4 rounded-xl border text-xs" style={{ backgroundColor: '#E6FAFB', borderColor: IBL_CYAN, color: IBL_NAVY }}>
        <p className="font-semibold mb-1">Self-rating scale for principles:</p>
        <p>1 = Rarely true of me today &nbsp;·&nbsp; 2 = Sometimes true, but inconsistent &nbsp;·&nbsp; 3 = Often true in my leadership &nbsp;·&nbsp; 4 = Strongly present and visible &nbsp;·&nbsp; 5 = A clear strength, consistently demonstrated</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: Your Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionHeader number={1} title="Your Details" />
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Leader Name</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{leader.name}</p>
            </div>
            <Field label="Email" required>
              <TextInput value={form.email} onChange={v => set('email', v)} placeholder="your@email.com" />
            </Field>
            <Field label="Team" required>
              <TextInput value={form.team} onChange={v => set('team', v)} placeholder="e.g. Customer Success" />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Leadership Inspiration ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionHeader number={2} title="Leadership Inspiration" />
          <div className="space-y-4">
            <Field label="Three leadership qualities I admire">
              <TextArea
                value={form.leadershipQualities}
                onChange={v => set('leadershipQualities', v)}
                placeholder="List the qualities you most admire in leaders you've looked up to..."
              />
            </Field>
            <Field label="Behaviours I admired in those leaders">
              <TextArea
                value={form.behavioursAdmired}
                onChange={v => set('behavioursAdmired', v)}
                placeholder="Describe the specific behaviours that stood out..."
              />
            </Field>
          </div>
        </div>

        {/* ── Section 3: My Team Today ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionHeader number={3} title="My Team Today" />
          <p className="text-xs text-gray-500 mb-5">Rate from 1 (Not at all) to 5 (Completely)</p>
          <div className="space-y-6">
            {[
              { key: 'teamClearOnDirection' as const, label: 'My team feels clear on direction' },
              { key: 'teamUnderstandsPurpose' as const, label: 'My team understands the purpose behind our work' },
              { key: 'teamTreatedFairly' as const, label: 'My team feels treated fairly and with respect' },
              { key: 'teamEncouraged' as const, label: 'My team feels encouraged to grow' },
              { key: 'teamSafeToShare' as const, label: 'My team feels safe to share ideas and mistakes' },
              { key: 'teamTrustsWord' as const, label: 'My team trusts my word' },
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <RatingButtons
                  value={form[key]}
                  onChange={v => set(key, v)}
                  scaleLabels={PERCEPTION_SCALE_LABELS}
                />
              </Field>
            ))}
            <Field label="One thing I want my team to feel more of">
              <TextArea
                value={form.oneThingTeamShouldFeel}
                onChange={v => set('oneThingTeamShouldFeel', v)}
                placeholder="What would make the biggest difference for your team?"
                rows={2}
              />
            </Field>
          </div>
        </div>

        {/* ── Section 4: Principle Self-Assessments ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionHeader number={4} title="Principle Self-Assessments" />
          <p className="text-xs text-gray-500 mb-6">For each principle, rate where you believe you are today and provide brief evidence of what you currently do in practice.</p>
          <div className="space-y-8">
            {PRINCIPLES.map(p => (
              <div key={p.id} className="border-t border-gray-100 pt-6 first:border-t-0 first:pt-0">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: IBL_NAVY }}
                  >
                    {p.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{p.expectation}</p>
                    <ul className="mt-2 space-y-0.5">
                      {p.behaviours.map(b => (
                        <li key={b} className="text-xs text-gray-400 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-0.5">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="ml-10 space-y-3">
                  <Field label={`${p.shortTitle} – Self-rating`}>
                    <RatingButtons
                      value={form[p.id as PrincipleKey].rating}
                      onChange={v => setPrinciple(p.id as PrincipleKey, 'rating', v)}
                      scaleLabels={RATING_SCALE_LABELS}
                    />
                  </Field>
                  <Field label={`${p.shortTitle} – Evidence`}>
                    <TextArea
                      value={form[p.id as PrincipleKey].evidence}
                      onChange={v => setPrinciple(p.id as PrincipleKey, 'evidence', v)}
                      placeholder="What do you currently do in practice that demonstrates this principle?"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 5: Summary ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <SectionHeader number={5} title="Summary & Intentions" />
          <div className="space-y-4">
            <Field label="Strongest principle today">
              <TextInput
                value={form.strongestPrinciple}
                onChange={v => set('strongestPrinciple', v)}
                placeholder="e.g. Lead with Purpose & Clarity"
              />
            </Field>
            <Field label="Main development area">
              <TextInput
                value={form.mainDevelopmentArea}
                onChange={v => set('mainDevelopmentArea', v)}
                placeholder="e.g. Build Trust through Accountability"
              />
            </Field>
            <Field label="Why does this development area matter for me and my team?">
              <TextArea
                value={form.whyDevelopmentAreaMatters}
                onChange={v => set('whyDevelopmentAreaMatters', v)}
                placeholder="Reflect on the impact developing this area will have..."
              />
            </Field>
            <Field label="My leadership intention going forward">
              <TextArea
                value={form.leadershipIntention}
                onChange={v => set('leadershipIntention', v)}
                placeholder="What will you commit to doing differently or more consistently?"
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
            {existing ? 'Update Reflection' : 'Submit Starting Reflection'}
          </button>
        </div>
      </form>
    </div>
  );
}
