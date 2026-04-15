export type PrincipleKey =
  | 'leadWithPurpose'
  | 'roleModelValues'
  | 'setHighStandards'
  | 'enableInnovation'
  | 'actWithResponsibility'
  | 'buildTrust';

export interface PrincipleRating {
  rating: number; // 1–5
  evidence: string;
}

export interface StartingPoint {
  id: string;
  leaderId: string;
  submittedAt: string;

  // Leader info
  email: string;
  team: string;

  // Leadership inspiration
  leadershipQualities: string;
  behavioursAdmired: string;

  // Team perception (1–5 Likert)
  teamClearOnDirection: number;
  teamUnderstandsPurpose: number;
  teamTreatedFairly: number;
  teamEncouraged: number;
  teamSafeToShare: number;
  teamTrustsWord: number;
  oneThingTeamShouldFeel: string;

  // 6 Principle self-ratings
  leadWithPurpose: PrincipleRating;
  roleModelValues: PrincipleRating;
  setHighStandards: PrincipleRating;
  enableInnovation: PrincipleRating;
  actWithResponsibility: PrincipleRating;
  buildTrust: PrincipleRating;

  // Summary
  strongestPrinciple: string;
  mainDevelopmentArea: string;
  whyDevelopmentAreaMatters: string;
  leadershipIntention: string;
}

export interface CheckIn {
  id: string;
  leaderId: string;
  submittedAt: string;

  // Leader info
  email: string;
  team: string;
  month: string;

  // Focus
  selectedPrinciple: string;
  whyThisPrinciple: string;
  threeBehaviours: string;
  successMeasure: string;
  accountabilityPartner: string;

  // Reflection
  whatDidWell: string;
  whereFellShort: string;
  concreteExample: string;
  mainObstacle: string;
  feedbackFromTeam: string;
  feedbackFromManager: string;
  selfRating: number; // 1–5
  progressVersusLastMonth: 'improved' | 'same' | 'declined';
  supportNeeded: boolean;
  typeOfSupportNeeded: string;
  focusForNext30Days: string;
}

export interface TrackerData {
  startingPoints: StartingPoint[];
  checkIns: CheckIn[];
}

export interface Leader {
  id: string;
  name: string;
  color: string;
  initials: string;
}
