import rawSkills from './skills.json';
import type { DiscoveryQuestion, SkillDefinition, StyleId, WorkingStyle } from '../discovery-types';

export const styles: WorkingStyle[] = [
  { id: 'explorer', name: 'Explorer', description: 'You like asking useful questions and connecting new knowledge.' },
  { id: 'analyst', name: 'Analyst', description: 'You like comparing evidence and making the reasons behind a decision clear.' },
  { id: 'creator', name: 'Creator', description: 'You like turning ideas into something people can see and respond to.' },
  { id: 'communicator', name: 'Communicator', description: 'You like helping people understand one another and move a conversation forward.' },
  { id: 'organizer', name: 'Organizer', description: 'You like giving scattered work a clear sequence, owner, and next step.' },
  { id: 'builder', name: 'Builder', description: 'You like trying things, learning from the result, and making a repeatable way of working.' },
];

export const questions: DiscoveryQuestion[] = [
  {
    id: 'role', section: 'Your work', title: 'What kind of work fills most of your week?',
    description: 'Choose up to two. Your role adds context; it does not decide your working style.', maxSelections: 2,
    options: [
      { id: 'marketing', label: 'Marketing & communications' }, { id: 'sales', label: 'Sales & customer work' },
      { id: 'operations', label: 'Operations & administration' }, { id: 'product', label: 'Product & design' },
      { id: 'engineering', label: 'Engineering & technology' }, { id: 'data', label: 'Data & finance' },
      { id: 'education', label: 'Education & research' }, { id: 'people', label: 'People & team leadership' },
      { id: 'other', label: 'A different kind of work' }, { id: 'unknown', label: 'Still figuring it out' },
    ],
  },
  {
    id: 'goal', section: 'Your work', title: 'What would you most like AI to help with right now?',
    description: 'Choose one real outcome to start with. You can change this later.', maxSelections: 1,
    options: [
      { id: 'research', label: 'Make sense of information', description: 'Find themes, evidence, and useful questions.' },
      { id: 'decision', label: 'Make a clearer decision', description: 'Compare options against what matters.' },
      { id: 'creation', label: 'Create a useful first draft', description: 'Shape source material into a presentation.' },
      { id: 'communication', label: 'Keep a conversation moving', description: 'Turn meeting notes into clear follow-ups.' },
      { id: 'organization', label: 'Improve how work gets done', description: 'Spot friction in a process and plan a change.' },
      { id: 'building', label: 'Make a workflow repeatable', description: 'Describe a reusable way to do a recurring task.' },
      { id: 'unknown', label: 'Help me explore' },
    ],
  },
  {
    id: 'pain', section: 'Your work', title: 'What tends to get in the way?',
    description: 'Choose the frustration that is closest to your current task.', maxSelections: 1,
    options: [
      { id: 'scattered', label: 'The information is scattered' },
      { id: 'comparison', label: 'The options are hard to compare' },
      { id: 'blank', label: 'Starting from a blank page' },
      { id: 'explanation', label: 'Getting everyone to understand the same thing' },
      { id: 'repetition', label: 'Repeated work and unclear handoffs' },
      { id: 'prototype', label: 'Turning a good attempt into a repeatable process' },
      { id: 'unknown', label: 'It depends / not sure yet' },
    ],
  },
  {
    id: 'start', section: 'Your working style', title: 'A new task is still a little vague. Where would you start?',
    description: 'Choose your first instinct, then an optional second. The order matters.', maxSelections: 2,
    options: [
      { id: 'explorer', label: 'Ask questions and explore the context' },
      { id: 'analyst', label: 'Find evidence and criteria to compare' },
      { id: 'creator', label: 'Sketch a few ideas to react to' },
      { id: 'communicator', label: 'Talk with the people involved' },
      { id: 'organizer', label: 'Break it into steps and responsibilities' },
      { id: 'builder', label: 'Try a small version and learn from it' },
      { id: 'unknown', label: 'It depends / not sure yet' },
    ],
  },
  {
    id: 'output', section: 'Your working style', title: 'You have a desk full of information. What would you like to make first?',
    description: 'Choose a first preference and, if useful, a second.', maxSelections: 2,
    options: [
      { id: 'explorer', label: 'Connections and new questions to explore' },
      { id: 'analyst', label: 'A clear conclusion backed by evidence' },
      { id: 'creator', label: 'Something visual or a draft people can react to' },
      { id: 'communicator', label: 'A clear explanation for the people who need it' },
      { id: 'organizer', label: 'A plan with owners and next steps' },
      { id: 'builder', label: 'A reusable method to work through it' },
      { id: 'unknown', label: 'It depends / not sure yet' },
    ],
  },
  {
    id: 'team', section: 'Your working style', title: 'Which part of a team project do you most enjoy?',
    description: 'Think about what you enjoy doing, rather than your job title.', maxSelections: 2,
    options: [
      { id: 'explorer', label: 'Finding information and perspectives we are missing' },
      { id: 'analyst', label: 'Helping the team choose a well-reasoned direction' },
      { id: 'creator', label: 'Developing the concept and the presentation' },
      { id: 'communicator', label: 'Helping people understand and work together' },
      { id: 'organizer', label: 'Keeping priorities and handoffs clear' },
      { id: 'builder', label: 'Experimenting and making the method work' },
      { id: 'unknown', label: 'It depends / not sure yet' },
    ],
  },
  {
    id: 'experience', section: 'Your starting point', title: 'What have you tried with AI so far?',
    description: 'This helps choose a starting point. It is not a test of ability.', maxSelections: 1,
    options: [
      { id: 'new', label: 'I am just starting' },
      { id: 'basic', label: 'I chat with AI and adapt text' },
      { id: 'practiced', label: 'I work with files or several steps' },
      { id: 'advanced', label: 'I have built a workflow or written code with AI' },
      { id: 'unknown', label: 'Not sure how to describe it' },
    ],
  },
  {
    id: 'platform', section: 'Your starting point', title: 'Where would you like to try your skill?',
    description: 'Choose the tools you use. We group ChatGPT and Codex together under OpenAI, then explain the setup options with your results.', maxSelections: 1,
    options: [
      { id: 'chatgpt', label: 'ChatGPT / Codex', description: 'OpenAI tools. Setup depends on the app you use.' },
      { id: 'claude', label: 'Claude', description: 'Upload a skill through the Skills settings.' },
      { id: 'other', label: 'Another AI tool', description: 'Check skill support or try a sample task in chat.' },
      { id: 'unknown', label: 'Help me decide later' },
    ],
  },
  {
    id: 'inputs', section: 'Your starting point', title: 'What starting material do you already have?',
    description: 'Choose all that apply. You will review the specific inputs before trying a skill.', maxSelections: 5,
    options: [
      { id: 'notes', label: 'Text, notes, or a meeting transcript' },
      { id: 'documents', label: 'Documents or source excerpts' },
      { id: 'data', label: 'Tables or figures' },
      { id: 'visuals', label: 'Images or a visual reference' },
      { id: 'process', label: 'A process description, runbook, or working example' },
      { id: 'none', label: 'Nothing prepared yet' },
      { id: 'unknown', label: 'I am not sure what I have' },
    ],
  },
];

function isStyleId(value: string): value is StyleId {
  return styles.some((style) => style.id === value);
}

export const skills: SkillDefinition[] = rawSkills.map((skill) => {
  if (!isStyleId(skill.style)) throw new Error(`Unknown working style in skill ${skill.id}: ${skill.style}`);
  return { ...skill, style: skill.style };
});
