import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sources = new Set(['chatgpt', 'claude']);
const statuses = new Set(['imported', 'merged', 'unavailable']);

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

/** Validate the catalog and its source inventory without changing either file. */
export function validateCatalog(catalog, provenance) {
  const errors = [];
  const ids = new Set();
  const slugs = new Set();
  const mappedIds = new Set();
  const sourceIds = new Set();
  const actualCounts = { chatgpt: 0, claude: 0 };

  function requireText(value, path) {
    if (!hasText(value)) errors.push(`${path} must be a nonempty string.`);
  }

  function requireTextArray(value, path, minimum = 0) {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array of strings.`);
      return;
    }
    if (value.length < minimum) errors.push(`${path} must contain at least ${minimum} item.`);
    value.forEach((item, index) => requireText(item, `${path}[${index}]`));
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    errors.push('catalog must be a nonempty array.');
  }

  if (Array.isArray(catalog)) {
    catalog.forEach((entry, index) => {
      const path = `catalog[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${path} must be an object.`);
        return;
      }

      for (const field of ['id', 'slug', 'title', 'summary', 'outcome']) {
        requireText(entry[field], `${path}.${field}`);
      }
      if (hasText(entry.id)) {
        if (ids.has(entry.id)) errors.push(`${path}.id duplicates "${entry.id}".`);
        ids.add(entry.id);
      }
      if (hasText(entry.slug)) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) {
          errors.push(`${path}.slug must use lowercase words separated by hyphens.`);
        }
        if (slugs.has(entry.slug)) errors.push(`${path}.slug duplicates "${entry.slug}".`);
        slugs.add(entry.slug);
      }
      requireTextArray(entry.departments, `${path}.departments`, 1);
      requireTextArray(entry.tags, `${path}.tags`);
      requireTextArray(entry.prerequisites, `${path}.prerequisites`);

      if (!Array.isArray(entry.steps) || entry.steps.length === 0) {
        errors.push(`${path}.steps must contain at least one prompt.`);
        return;
      }
      const stepIds = new Set();
      entry.steps.forEach((step, stepIndex) => {
        const stepPath = `${path}.steps[${stepIndex}]`;
        if (!isRecord(step)) {
          errors.push(`${stepPath} must be an object.`);
          return;
        }
        for (const field of ['id', 'title', 'prompt']) {
          requireText(step[field], `${stepPath}.${field}`);
        }
        if (hasText(step.id)) {
          if (stepIds.has(step.id)) errors.push(`${stepPath}.id duplicates "${step.id}" within this entry.`);
          stepIds.add(step.id);
        }
        if (step.instruction !== undefined) requireText(step.instruction, `${stepPath}.instruction`);
      });
    });
  }

  if (!isRecord(provenance)) {
    errors.push('provenance must be an object.');
    return { valid: false, errors };
  }

  if (!hasText(provenance.retrievedAt) || !Number.isFinite(Date.parse(provenance.retrievedAt))) {
    errors.push('provenance.retrievedAt must be a valid date string.');
  }
  if (!isRecord(provenance.sourceCounts)) {
    errors.push('provenance.sourceCounts must declare chatgpt and claude counts.');
  } else {
    for (const source of sources) {
      const count = provenance.sourceCounts[source];
      if (!Number.isInteger(count) || count < 0) {
        errors.push(`provenance.sourceCounts.${source} must be a nonnegative integer.`);
      }
    }
  }

  if (!Array.isArray(provenance.entries) || provenance.entries.length === 0) {
    errors.push('provenance.entries must be a nonempty source inventory.');
  }
  if (Array.isArray(provenance.entries)) {
    provenance.entries.forEach((entry, index) => {
      const path = `provenance.entries[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${path} must be an object.`);
        return;
      }
      requireText(entry.sourceId, `${path}.sourceId`);
      if (!sources.has(entry.source)) {
        errors.push(`${path}.source must be chatgpt or claude.`);
      } else {
        actualCounts[entry.source] += 1;
        if (hasText(entry.sourceId)) {
          const key = `${entry.source}:${entry.sourceId}`;
          if (sourceIds.has(key)) errors.push(`${path} duplicates source record "${key}".`);
          sourceIds.add(key);
        }
      }

      let validUrl = false;
      if (typeof entry.url === 'string' && URL.canParse(entry.url)) {
        const url = new URL(entry.url);
        validUrl = url.protocol === 'https:' || url.protocol === 'http:';
      }
      if (!validUrl) errors.push(`${path}.url must be an absolute HTTP(S) URL.`);
      if (!statuses.has(entry.status)) {
        errors.push(`${path}.status must be imported, merged, or unavailable.`);
      }
      if (entry.reason !== undefined) requireText(entry.reason, `${path}.reason`);

      if (entry.status === 'unavailable') {
        if (!hasText(entry.reason)) errors.push(`${path}.reason is required for an unavailable source.`);
        if (entry.catalogId !== undefined) errors.push(`${path} cannot map an unavailable source to a catalog entry.`);
      } else if (entry.status === 'imported' || entry.status === 'merged') {
        if (!hasText(entry.catalogId)) {
          errors.push(`${path}.catalogId is required for ${entry.status} sources.`);
        } else if (!ids.has(entry.catalogId)) {
          errors.push(`${path}.catalogId references missing catalog entry "${entry.catalogId}".`);
        } else {
          mappedIds.add(entry.catalogId);
        }
      }
    });
  }

  if (isRecord(provenance.sourceCounts)) {
    for (const source of sources) {
      const declared = provenance.sourceCounts[source];
      if (Number.isInteger(declared) && declared >= 0 && declared !== actualCounts[source]) {
        errors.push(`provenance.sourceCounts.${source} declares ${declared} source records, but the inventory contains ${actualCounts[source]}.`);
      }
    }
  }
  for (const id of ids) {
    if (!mappedIds.has(id)) errors.push(`Catalog entry "${id}" has no source mapping.`);
  }

  return { valid: errors.length === 0, errors };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 0 && args.length !== 2) {
    console.error('Usage: node scripts/validate-catalog.mjs [catalog.json provenance.json]');
    process.exitCode = 1;
    return;
  }
  const catalogPath = resolve(args[0] ?? 'src/data/catalog.json');
  const provenancePath = resolve(args[1] ?? 'content/provenance.json');
  let catalog;
  let provenance;
  for (const [label, path] of [['catalog', catalogPath], ['provenance', provenancePath]]) {
    let raw;
    try {
      raw = await readFile(path, 'utf8');
    } catch (error) {
      console.error(`Cannot read ${label} at ${path}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.error(`Invalid JSON in ${label} at ${path}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    if (label === 'catalog') catalog = parsed;
    else provenance = parsed;
  }

  const result = validateCatalog(catalog, provenance);
  if (!result.valid) {
    console.error(`Catalog validation failed (${result.errors.length} issue${result.errors.length === 1 ? '' : 's'}):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  const unavailable = provenance.entries.filter((entry) => entry.status === 'unavailable').length;
  const merged = provenance.entries.filter((entry) => entry.status === 'merged').length;
  console.log(`Catalog valid: ${catalog.length} use cases; ${provenance.entries.length} source records (${merged} merged, ${unavailable} unavailable).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
