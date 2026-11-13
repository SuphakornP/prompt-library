import { questions, skills, styles } from '../data/discovery';
import type {
  DiscoveryAnswers, DiscoveryQuestion, QuestionId, SkillDefinition, SkillRecommendation,
  StyleId, StyleProfile,
} from '../discovery-types';

const styleQuestions: QuestionId[] = ['start', 'output', 'team'];
const exclusiveOptions = new Set(['unknown', 'none']);
const readinessOrder = { ready: 0, check: 1, prepare: 2 };

function questionById(id: QuestionId): DiscoveryQuestion {
  const question = questions.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown discovery question: ${id}`);
  return question;
}

function validSelections(question: DiscoveryQuestion, selected: string[] | undefined): boolean {
  if (!Array.isArray(selected) || !selected.length || selected.length > question.maxSelections) return false;
  if (new Set(selected).size !== selected.length) return false;
  if (selected.some((id) => !question.options.some((option) => option.id === id))) return false;
  return selected.length === 1 || !selected.some((id) => exclusiveOptions.has(id));
}

function validateAnswers(answers: DiscoveryAnswers) {
  for (const [id, selections] of Object.entries(answers)) {
    const question = questions.find((item) => item.id === id);
    if (!question) throw new Error(`Unknown discovery question: ${id}`);
    if (selections === undefined || (Array.isArray(selections) && selections.length === 0)) continue;
    if (!validSelections(question, selections)) throw new Error(`Invalid answer for discovery question: ${id}`);
  }
}

export function isQuestionAnswered(id: QuestionId, answers: DiscoveryAnswers): boolean {
  return validSelections(questionById(id), answers[id]);
}

export function completion(answers: DiscoveryAnswers) {
  const answered = questions.filter((question) => isQuestionAnswered(question.id, answers)).length;
  return { answered, total: questions.length, complete: answered === questions.length };
}

export function normalizeSelection(id: QuestionId, current: string[], optionId: string): string[] {
  const question = questionById(id);
  if (!question.options.some((option) => option.id === optionId)) throw new Error(`Invalid option for ${id}: ${optionId}`);
  if (current.length && !validSelections(question, current)) throw new Error(`Invalid current selection for ${id}`);
  if (current.includes(optionId)) return current.filter((option) => option !== optionId);
  if (question.maxSelections === 1 || exclusiveOptions.has(optionId)) return [optionId];
  const next = current.filter((option) => !exclusiveOptions.has(option));
  // At the limit, replace the last choice while preserving the first preference.
  return [...next.slice(0, question.maxSelections - 1), optionId];
}

function knownChoice(answers: DiscoveryAnswers, id: QuestionId): string | undefined {
  const choice = answers[id]?.[0];
  return choice && !exclusiveOptions.has(choice) ? choice : undefined;
}

export function profile(answers: DiscoveryAnswers): StyleProfile {
  validateAnswers(answers);
  const scores: Record<StyleId, number> = { explorer: 0, analyst: 0, creator: 0, communicator: 0, organizer: 0, builder: 0 };
  let answeredCount = 0;
  for (const questionId of styleQuestions) {
    const selected = answers[questionId] ?? [];
    if (!selected.length || selected[0] === 'unknown') continue;
    answeredCount += 1;
    selected.forEach((id, index) => {
      const style = styles.find((item) => item.id === id);
      if (style) scores[style.id] += index === 0 ? 2 : 1;
    });
  }
  if (answeredCount < 2) {
    return {
      kind: 'unknown', styles: [], scores, answeredCount,
      description: 'There is not enough preference information to name a working style. Your task and starting material can still guide what to try.',
    };
  }
  const ranked = [...styles].sort((a, b) => scores[b.id] - scores[a.id]);
  const highest = scores[ranked[0].id];
  const tied = ranked.filter((style) => scores[style.id] === highest);
  if (tied.length > 2) {
    return {
      kind: 'mixed', styles: tied, scores, answeredCount,
      description: 'Your answers draw on several working styles. Let the task in front of you guide your starting point.',
    };
  }
  if (highest - scores[ranked[1].id] <= 1) {
    const pair = ranked.slice(0, 2);
    return {
      kind: 'mixed', styles: pair, scores, answeredCount,
      description: `Your answers combine ${pair[0].name.toLowerCase()} and ${pair[1].name.toLowerCase()} preferences. The mix can change with the task.`,
    };
  }
  return { kind: 'primary', styles: [ranked[0]], scores, answeredCount, description: ranked[0].description };
}

function optionLabel(id: QuestionId, optionId: string): string {
  return questionById(id).options.find((option) => option.id === optionId)?.label ?? optionId;
}

function inputReadiness(answers: DiscoveryAnswers, skill: SkillDefinition): Pick<SkillRecommendation, 'readiness' | 'missingInputs'> {
  const selected = answers.inputs ?? [];
  const missingGroups = skill.requiredInputGroups.filter((group) => !group.some((input) => selected.includes(input)));
  const missingInputs = missingGroups.map((group) => group.map((input) => optionLabel('inputs', input)).join(' or '));
  if (!selected.length || selected.includes('unknown')) return { readiness: 'check', missingInputs };
  if (missingGroups.length) return { readiness: 'prepare', missingInputs };
  return { readiness: 'ready', missingInputs: [] };
}

export function recommendations(answers: DiscoveryAnswers, skillList: SkillDefinition[] = skills): SkillRecommendation[] {
  validateAnswers(answers);
  const workingStyle = profile(answers);
  const goal = knownChoice(answers, 'goal');
  const pain = knownChoice(answers, 'pain');
  const experience = knownChoice(answers, 'experience');
  return skillList.map((skill) => {
    let weighted = 0;
    let availableWeight = 0;
    const reasons: string[] = [];
    const goalMatch = goal ? skill.goalMatches[goal] ?? 0 : 0;
    const painMatch = pain ? skill.painMatches[pain] ?? 0 : 0;
    if (goal) {
      weighted += goalMatch * 45;
      availableWeight += 45;
      if (goalMatch) reasons.push(`${goalMatch === 1 ? 'Matches' : 'Supports part of'} your goal: ${optionLabel('goal', goal).toLowerCase()}.`);
    }
    if (pain) {
      weighted += painMatch * 25;
      availableWeight += 25;
      if (painMatch) reasons.push(`Can help with: ${optionLabel('pain', pain).toLowerCase()}.`);
    }
    if (experience) {
      weighted += (skill.experienceFit[experience] ?? 0) * 20;
      availableWeight += 20;
    }
    if (workingStyle.kind !== 'unknown') {
      weighted += (workingStyle.scores[skill.style] / (workingStyle.answeredCount * 2)) * 10;
      availableWeight += 10;
      if (workingStyle.styles.some((style) => style.id === skill.style)) reasons.push('Connects with a working preference in your answers.');
    }
    if ((goal || pain) && !goalMatch && !painMatch) reasons.unshift('An exploratory option; it is not a close match to your stated task.');
    if (!goal && !pain) reasons.unshift('An option to explore. Choose a current goal for more focused suggestions.');
    const readiness = inputReadiness(answers, skill);
    if (readiness.readiness === 'ready') reasons.push('You have a starting material category this skill uses. Review its specific inputs before trying it.');
    else if (readiness.readiness === 'prepare') reasons.push('Prepare the starting material first, or use the included fictional example.');
    else reasons.push('Check the required starting material, or use the included fictional example.');
    return {
      skill, reasons, ...readiness,
      score: availableWeight ? Math.round(weighted / availableWeight * 1000) / 10 : 0,
    };
  }).sort((a, b) => readinessOrder[a.readiness] - readinessOrder[b.readiness]
    || b.score - a.score || a.skill.editorialOrder - b.skill.editorialOrder || a.skill.id.localeCompare(b.skill.id));
}
