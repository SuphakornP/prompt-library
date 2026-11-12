import type { CatalogEntry } from '../types';

export interface LibraryFilters {
  query: string;
  department: string;
  task: string;
}

export function filterCatalog(entries: CatalogEntry[], filters: LibraryFilters) {
  const terms = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (filters.department && !entry.departments.includes(filters.department)) return false;
    if (filters.task && !entry.tags.includes(filters.task)) return false;
    const searchable = [entry.title, entry.summary, ...entry.departments, ...entry.tags,
      ...entry.steps.map((step) => step.prompt)].join(' ').toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  }).sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
}

export function readFilters(search: string): LibraryFilters {
  const params = new URLSearchParams(search);
  return { query: params.get('q') ?? '', department: params.get('department') ?? '', task: params.get('task') ?? '' };
}

export function filterSearch(filters: LibraryFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.department) params.set('department', filters.department);
  if (filters.task) params.set('task', filters.task);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const CHATGPT_URL = 'https://chatgpt.com/';

export function chatgptPromptUrl(prompt: string): string | null {
  if (!prompt.trim()) return null;
  const url = new URL(CHATGPT_URL);
  url.searchParams.set('q', prompt);
  // ChatGPT otherwise automatically submits q after filling the composer.
  url.searchParams.set('disable_auto_send', 'true');
  return url.href;
}

export function draftKey(entryId: string, stepId: string) {
  return `${entryId}/${stepId}`;
}
