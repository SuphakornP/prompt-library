import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { parseDocument } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const requiredFiles = ['SKILL.md', 'references/example.md', 'references/output-template.md'];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function validateCatalog(catalog) {
  if (!Array.isArray(catalog) || !catalog.length) throw new Error('Skill catalog must be a nonempty array.');
  const ids = new Set();
  for (const skill of catalog) {
    if (!isRecord(skill) || typeof skill.id !== 'string' || !idPattern.test(skill.id) || skill.id.length > 64) {
      throw new Error('Each skill catalog ID must be a lowercase, hyphenated name of at most 64 characters.');
    }
    if (ids.has(skill.id)) throw new Error(`Duplicate skill catalog ID: ${skill.id}`);
    if (typeof skill.version !== 'string' || !versionPattern.test(skill.version)) {
      throw new Error(`Invalid skill version for ${skill.id}; use major.minor.patch.`);
    }
    ids.add(skill.id);
  }
  return [...catalog].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

async function requireDirectory(directory) {
  const info = await lstat(directory);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Expected a real directory: ${directory}`);
}

async function readSkillFiles(directory, prefix = '') {
  await requireDirectory(directory);
  const files = new Map();
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in skill packages: ${relative}`);
    if (entry.isDirectory() && relative === 'references') {
      for (const [name, bytes] of await readSkillFiles(absolute, relative)) files.set(name, bytes);
    } else if (entry.isFile() && requiredFiles.includes(relative)) {
      files.set(relative, await readFile(absolute));
    } else {
      throw new Error(`Unknown file or directory in skill package: ${relative}`);
    }
  }
  return files;
}

function validateFrontmatter(text, skill) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) throw new Error(`${skill.id}/SKILL.md is missing YAML frontmatter.`);
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length || document.warnings.length) {
    throw new Error(`Invalid frontmatter for ${skill.id}: ${[...document.errors, ...document.warnings].map((item) => item.message).join('; ')}`);
  }
  const frontmatter = document.toJS({ maxAliasCount: 0 });
  if (!isRecord(frontmatter) || frontmatter.name !== skill.id) throw new Error(`Skill name must match folder/catalog ID: ${skill.id}`);
  if (typeof frontmatter.description !== 'string' || !frontmatter.description.trim() || frontmatter.description.length > 1024) {
    throw new Error(`Skill description must be nonempty and at most 1024 characters: ${skill.id}`);
  }
  if (!isRecord(frontmatter.metadata) || frontmatter.metadata.version !== skill.version) {
    throw new Error(`Skill version does not match catalog for ${skill.id}.`);
  }
  if (!text.slice(match[0].length).trim()) throw new Error(`Skill instructions are empty: ${skill.id}`);
}

function validateReferences(text, filename, files, id) {
  const links = [
    ...text.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g),
    ...text.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm),
  ];
  for (const link of links) {
    const target = link[1].replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:)/i.test(target) || target.startsWith('#')) continue;
    const local = decodeURIComponent(target.split(/[?#]/, 1)[0]);
    if (!local || /[\\\0]/.test(local) || local.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(local)) {
      throw new Error(`Invalid local reference in ${id}/${filename}: ${target}`);
    }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(filename), local));
    if (resolved === '..' || resolved.startsWith('../') || !files.has(resolved)) {
      throw new Error(`Missing or escaping reference in ${id}/${filename}: ${target}`);
    }
  }
}

/** Validate one source skill and return a reproducible, single-root ZIP. */
export async function packageSkill(sourceDir, skill) {
  validateCatalog([skill]);
  const files = await readSkillFiles(path.join(sourceDir, skill.id));
  for (const required of requiredFiles) {
    if (!files.has(required)) throw new Error(`Missing required skill file: ${skill.id}/${required}`);
  }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (const [filename, bytes] of files) {
    const text = decoder.decode(bytes);
    if (!text.trim()) throw new Error(`Empty skill file: ${skill.id}/${filename}`);
    if (/\[TODO\b|\bFIXME\b|^\s*(?:TODO|TBD)\s*:/im.test(text)) {
      throw new Error(`Unfinished scaffold in ${skill.id}/${filename}`);
    }
    if (filename === 'SKILL.md') validateFrontmatter(text, skill);
    validateReferences(text, filename, files, skill.id);
  }

  const archiveFiles = Object.fromEntries([...files.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([filename, bytes]) => [`${skill.id}/${filename}`, bytes]));
  // ZIP stores local calendar fields; a fixed local date also stays stable across timezones.
  const bytes = zipSync(archiveFiles, { level: 9, mtime: new Date(2000, 0, 1, 0, 0, 0), os: 3, attrs: 0o100644 << 16 });
  const filename = `${skill.id}-${skill.version}.zip`;
  return {
    bytes,
    manifest: {
      id: skill.id,
      version: skill.version,
      url: `/downloads/skills/${filename}`,
      filename,
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      files: Object.keys(archiveFiles),
    },
  };
}

/** Build every validated package before writing downloads or their manifest. */
export async function buildSkillPackages({
  sourceDir = path.join(root, 'content/skills'),
  catalogPath = path.join(root, 'src/data/skills.json'),
  outputDir = path.join(root, 'public/downloads/skills'),
  manifestPath = path.join(root, 'src/data/skill-downloads.json'),
} = {}) {
  const catalog = validateCatalog(JSON.parse(await readFile(catalogPath, 'utf8')));
  await requireDirectory(sourceDir);
  const sourceNames = (await readdir(sourceDir)).sort();
  const expectedNames = catalog.map((skill) => skill.id);
  if (sourceNames.length !== expectedNames.length || sourceNames.some((name, index) => name !== expectedNames[index])) {
    throw new Error('Skill source folders must match the catalog IDs exactly.');
  }
  const packages = await Promise.all(catalog.map((skill) => packageSkill(sourceDir, skill)));
  await mkdir(outputDir, { recursive: true });
  await requireDirectory(outputDir);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  for (const item of packages) await writeFile(path.join(outputDir, item.manifest.filename), item.bytes);
  const manifest = packages.map((item) => item.manifest);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) throw new Error('Usage: node scripts/build-skills.mjs');
  const manifest = await buildSkillPackages();
  console.log(`Validated and packaged ${manifest.length} skills (${manifest.reduce((sum, item) => sum + item.bytes, 0).toLocaleString('en')} bytes).`);
}
