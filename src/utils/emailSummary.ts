import type { CheckIn, BiWeeklyCheckIn } from '../types';
import { getPrinciple } from '../data/principles';

const RATING_LABELS: Record<number, string> = {
  1: 'Rarely (1/5)',
  2: 'Sometimes (2/5)',
  3: 'Often (3/5)',
  4: 'Strongly (4/5)',
  5: 'Consistently (5/5)',
};

const PROGRESS_LABELS: Record<string, string> = {
  improved: 'Improved',
  same: 'About the same',
  declined: 'Need to improve',
};

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Low — feeling stuck (1/5)',
  2: 'Some doubt, needs support (2/5)',
  3: 'Moderate — making progress (3/5)',
  4: 'Good — on track (4/5)',
  5: 'High — fully confident (5/5)',
};

const STATUS_LABELS: Record<string, string> = {
  'on-track':        'On Track',
  'progressing':     'Progressing',
  'needs-attention': 'Needs Attention',
};

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Only include non-empty lines
function lines(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join('\n');
}

export function buildCheckInMailto(ci: CheckIn, leaderName: string): string {
  const principle     = getPrinciple(ci.selectedPrinciple);
  const principleLabel = principle
    ? `P${principle.number} — ${principle.shortTitle}`
    : ci.selectedPrinciple;

  const subject = `IEL Pioneer — 30-Day Check-In Summary${ci.month ? ` (${ci.month})` : ''}`;

  const body = lines(
    `Dear ${leaderName},`,
    '',
    `Here is a summary of your 30-day leadership check-in${ci.month ? ` for ${ci.month}` : ''}.`,
    '',
    '── MONTHLY FOCUS ──────────────────────────',
    `Principle: ${principleLabel}`,
    ci.whyThisPrinciple    && `Why: ${ci.whyThisPrinciple}`,
    ci.threeBehaviours     && `3 Behaviours: ${ci.threeBehaviours}`,
    ci.successMeasure      && `Success measure: ${ci.successMeasure}`,
    ci.accountabilityPartner && `Accountability partner: ${ci.accountabilityPartner}`,
    '',
    '── REFLECTION ──────────────────────────────',
    ci.whatDidWell    && `What went well: ${ci.whatDidWell}`,
    ci.whereFellShort && `Where I fell short: ${ci.whereFellShort}`,
    ci.concreteExample && `Concrete example: ${ci.concreteExample}`,
    ci.mainObstacle   && `Main obstacle: ${ci.mainObstacle}`,
    '',
    '── FEEDBACK & PROGRESS ─────────────────────',
    ci.feedbackFromTeam    && `Feedback from team: ${ci.feedbackFromTeam}`,
    ci.feedbackFromManager && `Feedback from manager: ${ci.feedbackFromManager}`,
    `Self-rating: ${RATING_LABELS[ci.selfRating] ?? `${ci.selfRating}/5`}`,
    `Progress vs last month: ${PROGRESS_LABELS[ci.progressVersusLastMonth] ?? ci.progressVersusLastMonth}`,
    ci.supportNeeded && ci.typeOfSupportNeeded && `Support needed: ${ci.typeOfSupportNeeded}`,
    '',
    '── NEXT STEPS ──────────────────────────────',
    ci.focusForNext30Days && `Focus for next 30 days: ${ci.focusForNext30Days}`,
    ci.nextCheckInDate && `Next check-in date: ${formatDateLong(ci.nextCheckInDate)}`,
    '',
    'Keep up the great work!',
    'IBL Energy — IEL Pioneer Programme',
  );

  const to = ci.email ?? '';
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildBiWeeklyMailto(
  bw: BiWeeklyCheckIn,
  leaderName: string,
  leaderEmail: string,
): string {
  const principle      = getPrinciple(bw.principleFocus);
  const principleLabel = principle
    ? `P${principle.number} — ${principle.shortTitle}`
    : bw.principleFocus;

  const subject = `IEL Pioneer — Bi-Weekly Check-In Summary (Week ${bw.week})`;

  const body = lines(
    `Dear ${leaderName},`,
    '',
    `Here is a summary of your bi-weekly check-in for Week ${bw.week}.`,
    '',
    '── WEEKLY PROGRESS ─────────────────────────',
    bw.keyActionsTaken && `Key actions taken: ${bw.keyActionsTaken}`,
    bw.whatWentWell    && `What went well: ${bw.whatWentWell}`,
    bw.challenges      && `Challenges: ${bw.challenges}`,
    bw.confidenceLevel > 0 && `Confidence level: ${CONFIDENCE_LABELS[bw.confidenceLevel] ?? `${bw.confidenceLevel}/5`}`,
    bw.supportNeeded && bw.typeOfSupportNeeded && `Support needed: ${bw.typeOfSupportNeeded}`,
    '',
    '── PRINCIPLE FOCUS ─────────────────────────',
    `Principle: ${principleLabel}`,
    `Status: ${STATUS_LABELS[bw.status] ?? bw.status}`,
    `Self-rating: ${bw.selfRating}/5`,
    bw.managerRating > 0 && `Manager rating: ${bw.managerRating}/5`,
    bw.overallProgressComment && `Overall comment: ${bw.overallProgressComment}`,
    '',
    bw.nextCheckInDate && `Next check-in: ${formatDateLong(bw.nextCheckInDate)}`,
    '',
    'Keep up the great work!',
    'IBL Energy — IEL Pioneer Programme',
  );

  return `mailto:${encodeURIComponent(leaderEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
