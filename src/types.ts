export interface PromptStep {
  id: string;
  title: string;
  prompt: string;
  instruction?: string;
}

export interface CatalogEntry {
  id: string;
  slug: string;
  title: string;
  summary: string;
  departments: string[];
  tags: string[];
  prerequisites: string[];
  outcome: string;
  steps: PromptStep[];
}
