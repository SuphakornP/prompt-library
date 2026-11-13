import { describe, expect, it } from 'vitest';
import catalog from '../src/data/catalog.json';
import { questions, skills, styles } from '../src/data/discovery';
import type { DiscoveryAnswers, SkillDefinition } from '../src/discovery-types';
import { completion, isQuestionAnswered, normalizeSelection, profile, recommendations } from '../src/lib/skill-discovery';

const organizerAnswers: DiscoveryAnswers = {
  role: ['operations'], goal: ['communication'], pain: ['explanation'],
  start: ['organizer'], output: ['organizer'], team: ['organizer'],
  experience: ['basic'], platform: ['chatgpt'], inputs: ['notes'],
};

describe('Skill discovery answers', () => {
  it('counts nine valid questions and does not mistake an empty or invalid answer for completion', () => {
    expect(completion(organizerAnswers)).toEqual({ answered: 9, total: 9, complete: true });
    expect(completion({})).toEqual({ answered: 0, total: 9, complete: false });
    expect(isQuestionAnswered('goal', { goal: ['not-a-goal'] })).toBe(false);
    expect(isQuestionAnswered('goal', { goal: [] })).toBe(false);
    expect(isQuestionAnswered('goal', { goal: ['unknown'] })).toBe(true);
  });

  it('preserves primary/secondary order, toggles choices, and replaces only the final selection at the limit', () => {
    expect(normalizeSelection('start', ['organizer'], 'analyst')).toEqual(['organizer', 'analyst']);
    expect(normalizeSelection('start', ['organizer', 'analyst'], 'creator')).toEqual(['organizer', 'creator']);
    expect(normalizeSelection('start', ['organizer', 'analyst'], 'organizer')).toEqual(['analyst']);
    expect(normalizeSelection('goal', ['research'], 'decision')).toEqual(['decision']);
  });

  it('keeps unknown and none exclusive and replaces them when a concrete option is selected', () => {
    expect(normalizeSelection('inputs', ['notes', 'documents'], 'none')).toEqual(['none']);
    expect(normalizeSelection('inputs', ['none'], 'notes')).toEqual(['notes']);
    expect(normalizeSelection('inputs', ['notes'], 'unknown')).toEqual(['unknown']);
    expect(normalizeSelection('start', ['analyst', 'creator'], 'unknown')).toEqual(['unknown']);
    expect(normalizeSelection('start', ['unknown'], 'explorer')).toEqual(['explorer']);
  });

  it('rejects disallowed values, duplicate answers, contradictory answers, and extra selections', () => {
    expect(() => profile({ start: ['not-a-style'] })).toThrow('Invalid answer');
    expect(() => recommendations({ inputs: ['notes', 'notes'] })).toThrow('Invalid answer');
    expect(() => recommendations({ inputs: ['none', 'notes'] })).toThrow('Invalid answer');
    expect(() => recommendations({ goal: ['research', 'decision'] })).toThrow('Invalid answer');
    expect(() => normalizeSelection('goal', [], 'not-a-goal')).toThrow('Invalid option');
    expect(() => normalizeSelection('inputs', ['none', 'notes'], 'documents')).toThrow('Invalid current selection');
  });
});

describe('Working style profile', () => {
  it('weights the first preference twice and the second once without using the role or goal', () => {
    const answers: DiscoveryAnswers = { start: ['explorer', 'analyst'], output: ['explorer'], team: ['analyst'] };
    expect(profile(answers).scores).toEqual({ explorer: 4, analyst: 3, creator: 0, communicator: 0, organizer: 0, builder: 0 });
    expect(profile({ ...answers, role: ['engineering'], goal: ['creation'] })).toEqual(profile(answers));
  });

  it('names a primary style only when it has a clear lead', () => {
    expect(profile(organizerAnswers)).toMatchObject({ kind: 'primary', styles: [{ id: 'organizer' }], answeredCount: 3 });
  });

  it('shows a pair for a near tie and a broad mixture when more than two styles tie for first', () => {
    const pair = profile({ start: ['explorer', 'analyst'], output: ['explorer'], team: ['analyst'] });
    expect(pair.kind).toBe('mixed');
    expect(pair.styles.map((style) => style.id)).toEqual(['explorer', 'analyst']);
    const broad = profile({ start: ['explorer'], output: ['analyst'], team: ['creator'] });
    expect(broad.kind).toBe('mixed');
    expect(broad.styles).toHaveLength(3);
  });

  it('leaves the style unknown with fewer than two usable preference answers', () => {
    const answers: DiscoveryAnswers = { start: ['organizer', 'analyst'], output: ['unknown'], team: ['unknown'] };
    expect(profile(answers)).toMatchObject({ kind: 'unknown', styles: [], answeredCount: 1 });
    expect(recommendations(answers).every((result) => result.score === 0)).toBe(true);
  });
});

describe('Skill recommendations', () => {
  it('lets a real goal outweigh a different working style', () => {
    expect(profile(organizerAnswers).styles[0].id).toBe('organizer');
    expect(recommendations(organizerAnswers)[0].skill.id).toBe('fellow-meeting-follow-through');
    const changed = recommendations({ ...organizerAnswers, goal: ['research'], pain: ['scattered'] });
    expect(changed[0].skill.id).toBe('fellow-research-evidence-brief');
    expect(profile({ ...organizerAnswers, goal: ['research'] })).toEqual(profile(organizerAnswers));
  });

  it('renormalizes known factors rather than treating unknowns as negative evidence', () => {
    const results = recommendations({ goal: ['research'], pain: ['unknown'], experience: ['unknown'] });
    expect(results.find((item) => item.skill.id === 'fellow-research-evidence-brief')?.score).toBe(100);
    expect(results.find((item) => item.skill.id === 'fellow-decision-brief')?.score).toBe(50);
    expect(recommendations({}).every((item) => item.score === 0 && Number.isFinite(item.score))).toBe(true);
  });

  it('uses only declared factors, leaving role and platform out of scores and profile', () => {
    const changed: DiscoveryAnswers = { ...organizerAnswers, role: ['engineering', 'product'], platform: ['claude'] };
    expect(recommendations(changed)).toEqual(recommendations(organizerAnswers));
    expect(profile(changed)).toEqual(profile(organizerAnswers));
    // Free task text lives separately in the UI; no question or scoring factor accepts it.
    expect(questions.some((question) => String(question.id) === 'task')).toBe(false);
  });

  it('distinguishes unknown material from explicitly missing material without blocking downloads', () => {
    expect(recommendations({}).every((item) => item.readiness === 'check')).toBe(true);
    expect(recommendations({ inputs: ['unknown'] }).every((item) => item.readiness === 'check')).toBe(true);
    expect(recommendations({ inputs: ['none'] }).every((item) => item.readiness === 'prepare')).toBe(true);
    expect(recommendations({ inputs: ['notes'] }).every((item) => item.readiness === 'ready')).toBe(true);
    expect(recommendations({ inputs: ['none'] })).toHaveLength(skills.length);
    expect(recommendations({ inputs: ['none'] }).every((item) => item.missingInputs.length > 0)).toBe(true);
  });

  it('requires one input from every declared group, not every alternative within a group', () => {
    const grouped: SkillDefinition = { ...skills[0], requiredInputGroups: [['notes', 'documents'], ['data']] };
    expect(recommendations({ inputs: ['notes'] }, [grouped])[0].readiness).toBe('prepare');
    expect(recommendations({ inputs: ['documents', 'data'] }, [grouped])[0].readiness).toBe('ready');
  });

  it('prefers available starting material and explains low relevance honestly', () => {
    const results = recommendations({ goal: ['building'], pain: ['prototype'], inputs: ['data'] });
    expect(results[0].skill.id).toBe('fellow-decision-brief');
    expect(results[0].readiness).toBe('ready');
    expect(results[0].reasons).toContain('An exploratory option; it is not a close match to your stated task.');
    expect(results.find((item) => item.skill.id === 'fellow-reusable-workflow-blueprint')?.readiness).toBe('prepare');
  });

  it('does not treat images alone as sufficient material for text-based skill workflows', () => {
    const results = recommendations({ goal: ['building'], pain: ['prototype'], inputs: ['visuals'] });
    expect(results.every((item) => item.readiness === 'prepare')).toBe(true);
    expect(results[0].skill.id).toBe('fellow-reusable-workflow-blueprint');
  });

  it('is deterministic, uses editorial order for ties, and does not mutate answers or catalog order', () => {
    const answersBefore = JSON.stringify(organizerAnswers);
    const skillIdsBefore = skills.map((skill) => skill.id);
    expect(recommendations(organizerAnswers)).toEqual(recommendations(organizerAnswers));
    expect(recommendations({}, [...skills].reverse()).map((item) => item.skill.id)).toEqual(skillIdsBefore);
    expect(JSON.stringify(organizerAnswers)).toBe(answersBefore);
    expect(skills.map((skill) => skill.id)).toEqual(skillIdsBefore);
  });
});

describe('Curated skill metadata', () => {
  it('provides six distinct skills with valid related workflows and complete source manifests', () => {
    expect(skills).toHaveLength(6);
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(6);
    const inputIds = questions.find((question) => question.id === 'inputs')!.options.map((option) => option.id);
    for (const skill of skills) {
      expect(skill.id).toMatch(/^fellow-[a-z-]+$/);
      expect(skill.version).toBe('1.0.0');
      expect(styles.some((style) => style.id === skill.style)).toBe(true);
      expect(catalog.some((entry) => entry.slug === skill.relatedPromptSlug)).toBe(true);
      expect(skill.sourceFiles).toEqual(['SKILL.md', 'references/output-template.md', 'references/example.md']);
      expect(skill.starterPrompt.length).toBeGreaterThan(100);
      expect(skill.sampleInput.length).toBeGreaterThan(100);
      for (const matches of [skill.goalMatches, skill.painMatches, skill.experienceFit]) {
        expect(Object.values(matches).every((value) => value === 0 || value === 0.5 || value === 1)).toBe(true);
      }
      expect(skill.requiredInputGroups.length).toBeGreaterThan(0);
      expect(skill.requiredInputGroups.every((group) => group.length && group.every((id) => inputIds.includes(id) && !['unknown', 'none'].includes(id)))).toBe(true);
    }
  });
});
