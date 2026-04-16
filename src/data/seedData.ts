import type { StartingPoint } from '../types';

/**
 * Pre-populated baseline reflections submitted by the leaders.
 * These are merged into the store on first load; they will never
 * overwrite an entry that already exists for the same leaderId.
 */
export const SEED_STARTING_POINTS: StartingPoint[] = [
  {
    id: 'seed-sp-edmund',
    leaderId: 'edmund',
    submittedAt: '2025-01-01T00:00:00.000Z',
    email: 'edmund.njagi@ibl-energy.com',
    team: 'Kenya',
    leadershipQualities: '1. Humility\n2. Reflective Intentionality\n3. Deliberate Clarity',
    behavioursAdmired:
      'Disciplined Simplicity (making complex things easy to understand and act on)',
    teamClearOnDirection: 4,
    teamUnderstandsPurpose: 4,
    teamTreatedFairly: 4,
    teamEncouraged: 4,
    teamSafeToShare: 4,
    teamTrustsWord: 4,
    oneThingTeamShouldFeel:
      'That they are trusted to make decisions without needing constant approval.',
    leadWithPurpose: {
      rating: 3,
      evidence:
        'Sharing my goals with my team and inviting questions/discussions around this with the aim of building transparency and clarity to improve team confidence about where we\'re going and why.',
    },
    roleModelValues: {
      rating: 4,
      evidence:
        'Be consistent in words and actions – Building trust within the team by avoiding the urge to override or micromanage. Instead I\'m asking questions to my team to understand their thinking then share my perspective letting the outcome play out.',
    },
    setHighStandards: {
      rating: 4,
      evidence:
        'Ensuring a team member arrives at a key client meeting prepared and not winging answers in the room.',
    },
    enableInnovation: {
      rating: 4,
      evidence:
        'Treating failure as data, not disaster – having post-mortem sessions with the team after project "mishaps" and tender results.',
    },
    actWithResponsibility: {
      rating: 4,
      evidence:
        'Considering impact beyond the quarter and into the future in the technology collaboration agreement (TOR AI). This avoids cutting corners on quality or overpromising a client.',
    },
    buildTrust: {
      rating: 4,
      evidence:
        'WIP: Following through on my commitments, however small, I try to do it within the timeframe implied.',
    },
    strongestPrinciple: 'Lead with Purpose & Clarity',
    mainDevelopmentArea: 'Enable Innovation & Progress',
    whyDevelopmentAreaMatters:
      "My team's ability to stay relevant, solve problems creatively, and grow beyond their current ceiling depends on whether I — as their leader — make it safe and structured enough for them to try, fail, and think differently.",
    leadershipIntention: 'To lead with deliberate clarity and courageous openness.',
  },
  {
    id: 'seed-sp-joshua',
    leaderId: 'joshua',
    submittedAt: '2025-01-01T00:00:00.000Z',
    email: 'joshua.desjardins@ibl-energy.com',
    team: 'Business Growth',
    leadershipQualities: 'Humility\nConsistency\nGenuine care',
    behavioursAdmired:
      'Humility – look in the mirror when things go wrong / look out the window when things go right\nConsistency – walk the talk\nGenuine care – Always open to put people first',
    teamClearOnDirection: 3,
    teamUnderstandsPurpose: 4,
    teamTreatedFairly: 5,
    teamEncouraged: 5,
    teamSafeToShare: 5,
    teamTrustsWord: 5,
    oneThingTeamShouldFeel:
      "Big picture, alignment with company's strategy, culture, leadership direction",
    leadWithPurpose: {
      rating: 4,
      evidence: 'I take time to explain the "why"',
    },
    roleModelValues: {
      rating: 4,
      evidence:
        'Reliability. I never leave a request, a need from any of my team member unaddressed for more than 24h.',
    },
    setHighStandards: {
      rating: 3,
      evidence:
        'Lead by example, discipline. Not demanding enough, not clear enough about objectives missed or achieved (reward).',
    },
    enableInnovation: {
      rating: 2,
      evidence: 'To think about. I am open, but nothing concrete created to encourage.',
    },
    actWithResponsibility: {
      rating: 3,
      evidence: 'Responsibility yes. Long term need to improve, and involve the team.',
    },
    buildTrust: {
      rating: 5,
      evidence: 'Accountability very strong sense for me. I act this way and guess the team sees it.',
    },
    strongestPrinciple: 'Build Trust through Accountability',
    mainDevelopmentArea: 'Lead with Purpose & Clarity',
    whyDevelopmentAreaMatters:
      "Organisation shift / break silos. Structure and strategy being created. It is the one most important request from the team: see the big picture, have clear objectives.",
    leadershipIntention: 'USS Santa Fe – involve my team members in decision making.',
  },
];
