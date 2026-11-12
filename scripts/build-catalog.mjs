import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateCatalog } from './validate-catalog.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const partial = process.argv.includes('--partial');
const read = async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const raw = [...await read('content/raw/chatgpt.json'), ...await read('content/raw/claude.json')];
const editorial = [];
for (const name of ['chatgpt', 'claude-a', 'claude-b']) {
  try { editorial.push(...await read(`content/editorial/${name}.json`)); }
  catch (error) {
    if (partial && error.code === 'ENOENT') continue;
    throw error;
  }
}
const bySource = new Map();
for (const row of editorial) {
  if (bySource.has(row.sourceId)) throw new Error(`Repeated editorial source ${row.sourceId}`);
  bySource.set(row.sourceId, row);
}
const unknown = editorial.filter((row) => !raw.some((source) => source.sourceId === row.sourceId));
if (unknown.length) throw new Error(`Unknown source IDs: ${unknown.map((row) => row.sourceId).join(', ')}`);
const pending = raw.filter((row) => !bySource.has(row.sourceId));
if (pending.length && !partial) throw new Error(`${pending.length} source entries still need editorial review.`);
const merges = await read('content/merges.json');
const sourceMerges = new Map();
for (const merge of merges) {
  if (!merge.reason?.trim() || merge.sourceIds.length < 2) throw new Error('Every merge needs sources and an editorial reason.');
  for (const sourceId of merge.sourceIds) {
    if (!raw.some((source) => source.sourceId === sourceId)) throw new Error(`Unknown merged source ${sourceId}`);
    if (sourceMerges.has(sourceId)) throw new Error(`Source appears in multiple merges: ${sourceId}`);
    sourceMerges.set(sourceId, merge);
  }
}

const catalog = [];
const provenance = {
  retrievedAt: raw.map((row) => row.retrievedAt).sort().at(-1),
  sourceCounts: { chatgpt: raw.filter((row) => row.source === 'chatgpt').length, claude: raw.filter((row) => row.source === 'claude').length },
  entries: [],
};
const usedSlugs = new Set();
const appliedMerges = new Set();
for (const source of raw) {
  const row = bySource.get(source.sourceId);
  if (!row) continue;
  const evidence = { sourceId: source.sourceId, source: source.source, url: source.url };
  if (row.status === 'unavailable') {
    provenance.entries.push({ ...evidence, status: 'unavailable', reason: row.reason });
    continue;
  }
  const merge = sourceMerges.get(source.sourceId);
  if (merge && merge.sourceIds.every((id) => bySource.has(id))) {
    const alreadyApplied = appliedMerges.has(merge.entry.id);
    if (!alreadyApplied) {
      if (usedSlugs.has(merge.entry.slug)) throw new Error(`Merged slug collision: ${merge.entry.slug}`);
      catalog.push(structuredClone(merge.entry));
      usedSlugs.add(merge.entry.slug);
      appliedMerges.add(merge.entry.id);
    }
    provenance.entries.push({ ...evidence, status: alreadyApplied ? 'merged' : 'imported', catalogId: merge.entry.id, reason: merge.reason });
    continue;
  }
  const entry = structuredClone(row.entry);
  if (usedSlugs.has(entry.slug)) {
    // Equal source slugs can describe different deliverables. Keep both without provider labels.
    const base = `${entry.slug}-${entry.departments[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
    entry.slug = slug;
    entry.id = `fp-${slug}`;
  }
  usedSlugs.add(entry.slug);
  catalog.push(entry);
  provenance.entries.push({ ...evidence, status: 'imported', catalogId: entry.id });
}
catalog.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
if (!partial) {
  const result = validateCatalog(catalog, provenance);
  if (!result.valid) throw new Error(result.errors.join('\n'));
}
await mkdir(path.join(root, 'src/data'), { recursive: true });
await writeFile(path.join(root, 'src/data/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
if (!partial) await writeFile(path.join(root, 'content/provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(`${partial ? 'Preview' : 'Validated'} catalog: ${catalog.length} prompts, ${pending.length} source entries pending.`);
