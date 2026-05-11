import { useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, getLatestSP } from '../context/StoreContext';
import { getLeader } from '../data/leaders';
import { PRINCIPLES } from '../data/principles';
import type { CheckIn } from '../types';

const IBL_NAVY = '#002060';
const IBL_CYAN = '#00D0DA';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
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

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none
                 focus:ring-2 focus:ring-[#00D0DA] focus:border-transparent resize-none"
    />
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold
                   text-xs flex-shrink-0"
        style={{ backgroundColor: IBL_NAVY }}
      >
        {number}
      </div>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

export default function BiWeeklyLeaderForm() {
  const { leaderId } = useParams<{ leaderId: string }>();
  const navigate = useNavigate();
  const { data, addCheckIn } = useStore();

  const leader = getLeader(leaderId ?? '');
  const sp = getLatestSP(data.startingPoints, leaderId ?? '');

  const latestThirtyDay = data.checkIns
    .filter(c => c.leaderId === leaderId && c.type !== 'bi-weekly')
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  const principleId = latestThirtyDay?.selectedPrinciple ?? '';
  const principleFocusText = sp?.mainDevelopmentArea ?? '';
  const principleObj = PRINCIPLES.find(p => p.id === principleId);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const [howGoing, setHowGoing] = useState('');
  const [supportNeeded, setSupportNeeded] = useState(false);
  const [typeOfSupport, setTypeOfSupport] = useState('');
  const [whatDidWell, setWhatDidWell] = useState('');
  const [focusNext2Weeks, setFocusNext2Weeks] = useState('');

  if (!leader) return <p className="text-gray-500">Leader not found.</p>;

  if (!sp) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          Please complete the starting reflection before adding a check-in.
        </p>
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ci: CheckIn = {
      id: crypto.randomUUID(),
      leaderId: leader!.id,
      submittedAt: new Date().toISOString(),
      type: 'bi-weekly',
      email: sp?.email ?? '',
      team: sp?.team ?? '',
      month: dateLabel,
      selectedPrinciple: principleId,
      whyThisPrinciple: howGoing,
      threeBehaviours: '',
      successMeasure: '',
      accountabilityPartner: '',
      whatDidWell,
      whereFellShort: '',
      concreteExample: '',
      mainObstacle: '',
      feedbackFromTeam: '',
      feedbackFromManager: '',
      selfRating: 0,
      progressVersusLastMonth: 'same',
      supportNeeded,
      typeOfSupportNeeded: typeOfSupport,
      focusForNext30Days: focusNext2Weeks,
      nextCheckInDate: '',
    };
    addCheckIn(ci);
    navigate(`/leaders/${leader!.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: IBL_NAVY }}
          >
            {leader.initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bi-Weekly Check-In</h1>
            <p className="text-sm text-gray-500">{leader.name} · {dateLabel}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          A quick reflection on the last 2 weeks — your principle focus, what went well, and what's next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: About ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={1} title="About" />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Leader</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{leader.name}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Team</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{sp.team}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Email</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{sp.email}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{dateLabel}</p>
            </div>
          </div>
        </div>

        {/* ── Section 2: Principle Focus ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={2} title="Principle Focus" />
          <div className="space-y-4">

            <div className="p-4 rounded-xl border-l-4"
                 style={{ backgroundColor: '#eff6ff', borderLeftColor: IBL_CYAN }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                 style={{ color: IBL_CYAN }}>
                Your current principle focus
              </p>
              {principleObj ? (
                <p className="text-sm font-semibold text-gray-900">
                  P{principleObj.number} — {principleObj.title}
                </p>
              ) : principleFocusText ? (
                <p className="text-sm font-semibold text-gray-900">{principleFocusText}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No principle focus set yet — complete a 30-Day check-in first.
                </p>
              )}
            </div>

            <Field label="How is your Principle Focus going?" required>
              <TextArea
                value={howGoing}
                onChange={setHowGoing}
                placeholder="Share how you've been progressing with your principle focus over the last 2 weeks..."
                rows={4}
              />
            </Field>

            <Field label="Do you need support?">
              <div className="flex gap-3 mb-3">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setSupportNeeded(val)}
                    className="px-6 py-2 rounded-lg border text-sm font-medium transition-all"
                    style={supportNeeded === val
                      ? { backgroundColor: IBL_NAVY, color: '#fff', borderColor: 'transparent' }
                      : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              {supportNeeded && (
                <TextArea
                  value={typeOfSupport}
                  onChange={setTypeOfSupport}
                  placeholder="Describe the support that would help you most..."
                  rows={2}
                />
              )}
            </Field>

          </div>
        </div>

        {/* ── Section 3: Bi-Weekly Reflection ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader number={3} title="Bi-Weekly Reflection" />
          <div className="space-y-4">
            <Field label="What I did well these last 2 weeks" required>
              <TextArea
                value={whatDidWell}
                onChange={setWhatDidWell}
                placeholder="Celebrate your achievements, however small..."
                rows={4}
              />
            </Field>
            <Field label="Focus for next 2 weeks" required>
              <TextArea
                value={focusNext2Weeks}
                onChange={setFocusNext2Weeks}
                placeholder="What will you focus on over the next 2 weeks?"
                rows={4}
              />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm
                       font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
