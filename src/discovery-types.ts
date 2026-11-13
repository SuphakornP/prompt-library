export type StyleId = 'explorer' | 'analyst' | 'creator' | 'communicator' | 'organizer' | 'builder';
export type QuestionId = 'role' | 'goal' | 'pain' | 'start' | 'output' | 'team' | 'experience' | 'platform' | 'inputs';
export type DiscoveryAnswers = Partial<Record<QuestionId, string[]>>;

export interface WorkingStyle {
  id: StyleId;
  name: string;
  description: string;
}

export interface DiscoveryOption {
  id: string;
  label: string;
  description?: string;
}

export interface DiscoveryQuestion {
  id: QuestionId;
  title: string;
  description: string;
  section: string;
  options: DiscoveryOption[];
  maxSelections: number;
}

export interface SkillDefinition {
  id: string;
  version: string;
  title: string;
  summary: string;
  outcome: string;
  inputs: string[];
  style: StyleId;
  goalMatches: Partial<Record<string, number>>;
  painMatches: Partial<Record<string, number>>;
  experienceFit: Partial<Record<string, number>>;
  requiredInputGroups: string[][];
  relatedPromptSlug: string;
  starterPrompt: string;
  sampleInput: string;
  sourceFiles: string[];
  editorialOrder: number;
}

export interface StyleProfile {
  kind: 'primary' | 'mixed' | 'unknown';
  styles: WorkingStyle[];
  scores: Record<StyleId, number>;
  description: string;
  answeredCount: number;
}

export interface SkillRecommendation {
  skill: SkillDefinition;
  score: number;
  reasons: string[];
  readiness: 'ready' | 'prepare' | 'check';
  missingInputs: string[];
}
