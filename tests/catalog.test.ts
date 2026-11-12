import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/validate-catalog.mjs', import.meta.url));
const temporaryDirectories: string[] = [];

function fixture() {
  return {
    catalog: [{
      id: 'meeting-brief',
      slug: 'prepare-a-meeting-brief',
      title: 'Prepare a meeting brief',
      summary: 'Turn meeting context into a focused briefing.',
      departments: ['General'],
      tags: ['Meetings'],
      prerequisites: ['Meeting agenda and relevant notes'],
      outcome: 'A concise briefing with open questions and decisions.',
      steps: [{ id: 'brief', title: 'Draft the brief', prompt: 'Read [meeting notes] and prepare a brief.' }],
    }],
    provenance: {
      retrievedAt: '2026-11-12T00:00:00.000Z',
      sourceCounts: { chatgpt: 1, claude: 1 },
      entries: [
        { sourceId: 'meeting-brief', source: 'chatgpt', url: 'https://learn.chatgpt.com/use-cases/meeting-brief', status: 'imported', catalogId: 'meeting-brief' },
        { sourceId: 'meeting-prep', source: 'claude', url: 'https://academy.claude.com/use-cases/meeting-prep', status: 'merged', catalogId: 'meeting-brief', reason: 'Equivalent task and required inputs.' },
      ],
    },
  };
}

function validate(catalog: unknown, provenance: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'fellow-prompt-catalog-test-'));
  temporaryDirectories.push(directory);
  const catalogPath = join(directory, 'catalog.json');
  const provenancePath = join(directory, 'provenance.json');
  writeFileSync(catalogPath, JSON.stringify(catalog));
  writeFileSync(provenancePath, JSON.stringify(provenance));
  return spawnSync(process.execPath, [script, catalogPath, provenancePath], { encoding: 'utf8' });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('catalog source reconciliation', () => {
  it('accepts source records merged into the same use case', () => {
    const { catalog, provenance } = fixture();
    const result = validate(catalog, provenance);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('1 use cases; 2 source records (1 merged, 0 unavailable)');
  });

  it('accounts for unavailable source records with an explicit reason', () => {
    const { catalog, provenance } = fixture();
    const result = validate(catalog, {
      ...provenance,
      sourceCounts: { chatgpt: 1, claude: 2 },
      entries: [...provenance.entries, {
        sourceId: 'unavailable', source: 'claude', url: 'https://academy.claude.com/use-cases/unavailable',
        status: 'unavailable', reason: 'The public detail page did not expose prompt content.',
      }],
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('1 unavailable');
  });

  it('rejects duplicate entry IDs, slugs, and source identities', () => {
    const { catalog, provenance } = fixture();
    const result = validate([...catalog, ...catalog], {
      ...provenance,
      sourceCounts: { chatgpt: 2, claude: 1 },
      entries: [...provenance.entries, provenance.entries[0]],
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('.id duplicates');
    expect(result.stderr).toContain('.slug duplicates');
    expect(result.stderr).toContain('duplicates source record');
  });

  it('rejects a missing inventory record even when catalog mappings exist', () => {
    const { catalog, provenance } = fixture();
    provenance.sourceCounts.claude = 2;
    const result = validate(catalog, provenance);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('declares 2 source records, but the inventory contains 1');
  });

  it('rejects a source pointing at a nonexistent catalog entry', () => {
    const { catalog, provenance } = fixture();
    provenance.entries[1].catalogId = 'missing-entry';
    const result = validate(catalog, provenance);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('references missing catalog entry "missing-entry"');
  });

  it('rejects catalog entries with no source and unavailable records with no reason', () => {
    const { catalog, provenance } = fixture();
    const result = validate(catalog, {
      ...provenance,
      entries: provenance.entries.map(({ catalogId: _catalogId, reason: _reason, ...entry }) => ({ ...entry, status: 'unavailable' })),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('reason is required for an unavailable source');
    expect(result.stderr).toContain('has no source mapping');
  });
});

describe('catalog usability', () => {
  it('rejects empty prompts, missing steps, and duplicate step IDs', () => {
    const { catalog, provenance } = fixture();
    catalog[0].steps[0].prompt = '   ';
    catalog[0].steps.push({ ...catalog[0].steps[0] });
    const duplicateResult = validate(catalog, provenance);
    expect(duplicateResult.status).toBe(1);
    expect(duplicateResult.stderr).toContain('.prompt must be a nonempty string');
    expect(duplicateResult.stderr).toContain('within this entry');

    catalog[0].steps = [];
    const missingResult = validate(catalog, provenance);
    expect(missingResult.status).toBe(1);
    expect(missingResult.stderr).toContain('must contain at least one prompt');
  });

  it('rejects malformed entries instead of crashing or accepting partial content', () => {
    const { provenance } = fixture();
    const result = validate([null, { id: 'broken', slug: 'Invalid slug', steps: [null] }], provenance);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('catalog[0] must be an object');
    expect(result.stderr).toContain('.title must be a nonempty string');
    expect(result.stderr).toContain('.departments must be an array');
    expect(result.stderr).toContain('.slug must use lowercase words');
    expect(result.stderr).toContain('steps[0] must be an object');
  });

  it('requires actionable provenance fields and declared source names', () => {
    const { catalog, provenance } = fixture();
    const result = validate(catalog, {
      ...provenance,
      retrievedAt: 'not-a-date',
      entries: [{ sourceId: '', source: 'unknown', url: 'javascript:alert(1)', status: 'pending' }],
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('retrievedAt must be a valid date');
    expect(result.stderr).toContain('source must be chatgpt or claude');
    expect(result.stderr).toContain('url must be an absolute HTTP(S) URL');
    expect(result.stderr).toContain('status must be imported, merged, or unavailable');
  });
});
