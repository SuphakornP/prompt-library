import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../src/types';
import { chatgptPromptUrl, draftKey, filterCatalog, filterSearch, readFilters } from '../src/lib/library';

const makeEntry = (id: string, title: string, department: string, tag: string, prompt: string): CatalogEntry => ({
  id, slug: id, title, summary: `Practical ${title}`, departments: [department], tags: [tag], prerequisites: [],
  outcome: 'An actionable result', steps: [{ id: 'start', title: 'Start here', prompt }],
});
const entries = [
  makeEntry('campaign', 'Write a campaign brief', 'Marketing', 'Writing', 'Consider regional audience needs and a spreadsheet.'),
  makeEntry('research', 'Analyze an interview', 'Research', 'Analysis', 'Find themes in the supplied transcript.'),
  makeEntry('sales', 'Build a sales brief', 'Sales', 'Writing', 'Use a spreadsheet to find account priorities.'),
];

describe('Library discovery', () => {
  it('searches prompt text across the complete catalog in alphabetical order', () => {
    expect(filterCatalog(entries, { query: 'SPREADSHEET', department: '', task: '' }).map((item) => item.id)).toEqual(['sales', 'campaign']);
  });
  it('combines query terms with department and task filters', () => {
    expect(filterCatalog(entries, { query: ' regional  spreadsheet ', department: 'Marketing', task: 'Writing' }).map((item) => item.id)).toEqual(['campaign']);
    expect(filterCatalog(entries, { query: 'regional', department: 'Sales', task: 'Writing' })).toEqual([]);
  });
  it('returns a genuine empty result for unmatched terms', () => {
    expect(filterCatalog(entries, { query: 'nonexistent', department: '', task: '' })).toEqual([]);
  });
  it('round-trips special characters in shareable library filters', () => {
    const filters = { query: 'R&D / growth?', department: 'Marketing', task: 'Writing' };
    expect(readFilters(filterSearch(filters))).toEqual(filters);
    expect(filterSearch({ query: '', department: '', task: '' })).toBe('');
  });
});

describe('Prompt handling', () => {
  it('keeps draft identity separate for every case and step', () => {
    expect(draftKey('a', 'b')).not.toBe(draftKey('b', 'a'));
  });
  it('fills the composer without enabling automatic submission', () => {
    const target = chatgptPromptUrl('Help me plan this workshop.');
    expect(target).not.toBeNull();
    const url = new URL(target!);
    expect(url.origin + url.pathname).toBe('https://chatgpt.com/');
    expect(url.searchParams.get('q')).toBe('Help me plan this workshop.');
    expect(url.searchParams.get('disable_auto_send')).toBe('true');
  });
  it('preserves Unicode, newlines, whitespace and URL punctuation exactly', () => {
    const prompt = '  Draft R&D + sales: 50% #ready? a=b & c/d\nแผนงาน ✅\n  ';
    const url = new URL(chatgptPromptUrl(prompt)!);
    expect(url.searchParams.get('q')).toBe(prompt);
    expect([...url.searchParams.keys()]).toEqual(['q', 'disable_auto_send']);
    expect(url.hash).toBe('');
  });
  it('does not truncate long edited prompts', () => {
    const prompt = 'Long prompt line with R&D + context.\n'.repeat(400);
    expect(prompt.length).toBeGreaterThan(10_350);
    expect(new URL(chatgptPromptUrl(prompt)!).searchParams.get('q')).toBe(prompt);
  });
  it('does not create a handoff for empty or whitespace-only drafts', () => {
    expect(chatgptPromptUrl('')).toBeNull();
    expect(chatgptPromptUrl(' \n\t ')).toBeNull();
  });
});
