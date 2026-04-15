import type { PrincipleKey } from '../types';

export interface Principle {
  id: PrincipleKey;
  number: number;
  title: string;
  shortTitle: string;
  expectation: string;
  behaviours: string[];
}

export const PRINCIPLES: Principle[] = [
  {
    id: 'leadWithPurpose',
    number: 1,
    title: 'Lead with Purpose & Clarity',
    shortTitle: 'Purpose & Clarity',
    expectation:
      'Leaders explain the why, set direction, and ensure teams understand priorities and how their work contributes to the wider purpose.',
    behaviours: [
      'Explain decisions and priorities clearly',
      'Connect daily work to purpose and strategy',
      'Set clear expectations and direction',
      'Reduce ambiguity and confusion',
    ],
  },
  {
    id: 'roleModelValues',
    number: 2,
    title: 'Role-Model Our Values',
    shortTitle: 'Role-Model Values',
    expectation:
      "Leaders consistently demonstrate the company's values through their behaviours, decisions, and interactions.",
    behaviours: [
      'Act with integrity and fairness',
      'Be consistent in words and actions',
      'Use values as a decision lens',
      'Address behaviour misalignment early',
    ],
  },
  {
    id: 'setHighStandards',
    number: 3,
    title: 'Set High Standards & Drive Excellence',
    shortTitle: 'High Standards',
    expectation:
      'Leaders hold themselves and their teams to high standards and foster continuous improvement.',
    behaviours: [
      'Walk the talk on quality',
      'Encourage learning and feedback',
      'Take ownership of outcomes',
      'Avoid "good enough" standards',
    ],
  },
  {
    id: 'enableInnovation',
    number: 4,
    title: 'Enable Innovation & Progress',
    shortTitle: 'Innovation & Progress',
    expectation:
      'Leaders create the conditions for innovation by encouraging initiative, learning, and responsible risk-taking.',
    behaviours: [
      'Encourage new ideas and experimentation',
      'Support learning from success and failure',
      'Provide the right tools and support',
      'Balance innovation with responsibility',
    ],
  },
  {
    id: 'actWithResponsibility',
    number: 5,
    title: 'Act with Responsibility & Long-Term Perspective',
    shortTitle: 'Responsibility',
    expectation:
      'Leaders make decisions that balance short-term performance with long-term sustainability, people, and impact.',
    behaviours: [
      'Take long-term impact into account',
      'Avoid short-term fixes that undermine trust',
      'Build resilience in teams and systems',
      'Think "build to last"',
    ],
  },
  {
    id: 'buildTrust',
    number: 6,
    title: 'Build Trust through Accountability',
    shortTitle: 'Trust & Accountability',
    expectation:
      'Leaders build trust by being transparent, consistent, and accountable.',
    behaviours: [
      'Do what they say they will do',
      'Take responsibility when things go wrong',
      'Communicate honestly',
      'Create psychological safety through consistency',
    ],
  },
];

export function getPrinciple(id: string): Principle | undefined {
  return PRINCIPLES.find(p => p.id === id);
}
