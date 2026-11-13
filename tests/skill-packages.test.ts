import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSkillPackages, packageSkill } from '../scripts/build-skills.mjs';

const temporaryDirectories: string[] = [];
const id = 'fellow-example';
const skill = { id, version: '1.0.0' };
const sourceText = `---
name: ${id}
description: Summarize supplied notes into a source-backed action list.
metadata:
  version: "1.0.0"
---

# Example skill

Use the [output template](references/output-template.md) and the [worked example](references/example.md).
Keep unknown dates explicit. Preserve the user's requested language, including Thai: สรุปงาน
`;

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'fellow-skill-packages-'));
  temporaryDirectories.push(directory);
  const sourceDir = path.join(directory, 'source');
  const skillDir = path.join(sourceDir, id);
  const catalogPath = path.join(directory, 'catalog.json');
  const outputDir = path.join(directory, 'downloads');
  const manifestPath = path.join(directory, 'manifest.json');
  await mkdir(path.join(skillDir, 'references'), { recursive: true });
  await writeFile(path.join(skillDir, 'SKILL.md'), sourceText);
  await writeFile(path.join(skillDir, 'references/output-template.md'), '# Action list\n\nUse columns for task, owner, due date, and evidence.\n');
  await writeFile(path.join(skillDir, 'references/example.md'), '# Example\n\nIf no date is agreed, mark it as not specified.\n');
  await writeFile(catalogPath, JSON.stringify([skill]));
  return { sourceDir, skillDir, catalogPath, outputDir, manifestPath };
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('Downloadable skill packages', () => {
  it('produces an extractable single-root ZIP and a manifest that describes its exact bytes', async () => {
    const paths = await fixture();
    const manifest = await buildSkillPackages(paths);
    expect(manifest).toHaveLength(1);
    const entry = manifest[0];
    const archive = await readFile(path.join(paths.outputDir, entry.filename));
    const extracted = unzipSync(archive);
    expect(Object.keys(extracted).sort()).toEqual([
      `${id}/SKILL.md`, `${id}/references/example.md`, `${id}/references/output-template.md`,
    ]);
    expect(new TextDecoder().decode(extracted[`${id}/SKILL.md`])).toBe(sourceText);
    expect(entry.files).toEqual(Object.keys(extracted));
    expect(entry.bytes).toBe(archive.length);
    expect(entry.sha256).toBe(createHash('sha256').update(archive).digest('hex'));
    expect(entry.url).toBe(`/downloads/skills/${id}-1.0.0.zip`);
    expect(JSON.parse(await readFile(paths.manifestPath, 'utf8'))).toEqual(manifest);
  });

  it('keeps archive bytes stable when filesystem timestamps and machine timezone differ', async () => {
    const paths = await fixture();
    vi.stubEnv('TZ', 'Pacific/Kiritimati');
    const first = await packageSkill(paths.sourceDir, skill);
    await utimes(path.join(paths.skillDir, 'SKILL.md'), new Date('2020-02-01'), new Date('2030-03-04'));
    vi.stubEnv('TZ', 'America/Los_Angeles');
    const second = await packageSkill(paths.sourceDir, skill);
    expect(second.bytes).toEqual(first.bytes);
    expect(second.manifest).toEqual(first.manifest);
  });

  it('does not overwrite the manifest or touch existing downloads when a source is corrupt', async () => {
    const paths = await fixture();
    await mkdir(paths.outputDir);
    await writeFile(path.join(paths.outputDir, 'unrelated.txt'), 'keep this release note');
    await writeFile(paths.manifestPath, 'prior manifest');
    await writeFile(path.join(paths.skillDir, 'SKILL.md'), `${sourceText}\n[Missing](references/missing.md)\n`);
    await expect(buildSkillPackages(paths)).rejects.toThrow('Missing or escaping reference');
    expect(await readFile(paths.manifestPath, 'utf8')).toBe('prior manifest');
    expect(await readFile(path.join(paths.outputDir, 'unrelated.txt'), 'utf8')).toBe('keep this release note');
    await expect(access(path.join(paths.outputDir, `${id}-1.0.0.zip`))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    ['mismatched name', sourceText.replace(`name: ${id}`, 'name: another-skill'), 'Skill name must match'],
    ['mismatched version', sourceText.replace('"1.0.0"', '"2.0.0"'), 'Skill version does not match'],
    ['invalid YAML', sourceText.replace('metadata:', 'metadata: [unterminated'), 'Invalid frontmatter'],
    ['duplicate YAML keys', sourceText.replace('metadata:', 'description: duplicate\nmetadata:'), 'Invalid frontmatter'],
    ['missing frontmatter', '# No metadata\n', 'missing YAML frontmatter'],
    ['unfinished scaffold', `${sourceText}\n[TODO: add the workflow]\n`, 'Unfinished scaffold'],
    ['escaping reference', `${sourceText}\n[Outside](../../outside.md)\n`, 'Missing or escaping reference'],
    ['encoded escaping reference', `${sourceText}\n[Outside](%2e%2e/%2e%2e/outside.md)\n`, 'Missing or escaping reference'],
    ['absolute local reference', `${sourceText}\n[Outside](/tmp/outside.md)\n`, 'Invalid local reference'],
  ])('rejects %s before publishing a package', async (_label, content, error) => {
    const paths = await fixture();
    await writeFile(path.join(paths.skillDir, 'SKILL.md'), content);
    await expect(buildSkillPackages(paths)).rejects.toThrow(error);
    await expect(access(paths.manifestPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects missing resources, unknown files, and symlinked source files', async () => {
    const paths = await fixture();
    const examplePath = path.join(paths.skillDir, 'references/example.md');
    await rm(examplePath);
    await expect(buildSkillPackages(paths)).rejects.toThrow('Missing required skill file');
    await writeFile(examplePath, '# Example\n');
    const unknownPath = path.join(paths.skillDir, 'private-notes.txt');
    await writeFile(unknownPath, 'Not a distributable resource');
    await expect(buildSkillPackages(paths)).rejects.toThrow('Unknown file');
    await rm(unknownPath);
    await rm(examplePath);
    await symlink(paths.catalogPath, examplePath);
    await expect(buildSkillPackages(paths)).rejects.toThrow('Symlinks are not allowed');
  });

  it('rejects traversal IDs, duplicate IDs, and unlisted source folders', async () => {
    const paths = await fixture();
    await writeFile(paths.catalogPath, JSON.stringify([{ id: '../escape', version: '1.0.0' }]));
    await expect(buildSkillPackages(paths)).rejects.toThrow('catalog ID');
    await writeFile(paths.catalogPath, JSON.stringify([skill, skill]));
    await expect(buildSkillPackages(paths)).rejects.toThrow('Duplicate skill catalog ID');
    await writeFile(paths.catalogPath, JSON.stringify([skill]));
    await mkdir(path.join(paths.sourceDir, 'unlisted-skill'));
    await expect(buildSkillPackages(paths)).rejects.toThrow('match the catalog IDs exactly');
  });

  it('keeps unrelated existing downloads when rebuilding valid packages', async () => {
    const paths = await fixture();
    await mkdir(paths.outputDir);
    await writeFile(path.join(paths.outputDir, 'another-download.zip'), 'unrelated artifact');
    await buildSkillPackages(paths);
    expect(await readFile(path.join(paths.outputDir, 'another-download.zip'), 'utf8')).toBe('unrelated artifact');
  });

  it('ships one archive per real catalog skill with no files outside its root', async () => {
    const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
    const catalog = JSON.parse(await readFile(path.join(repositoryRoot, 'src/data/skills.json'), 'utf8'));
    const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'src/data/skill-downloads.json'), 'utf8'));
    expect(manifest.map((entry: { id: string }) => entry.id).sort()).toEqual(catalog.map((entry: { id: string }) => entry.id).sort());
    for (const entry of manifest) {
      const archive = await readFile(path.join(repositoryRoot, 'public', entry.url));
      expect(archive.length).toBe(entry.bytes);
      expect(createHash('sha256').update(archive).digest('hex')).toBe(entry.sha256);
      const files = unzipSync(archive);
      expect(Object.keys(files)).toEqual(entry.files);
      for (const [filename, bytes] of Object.entries(files)) {
        expect(filename.startsWith(`${entry.id}/`)).toBe(true);
        expect(filename.split('/')).not.toContain('..');
        expect(Buffer.from(bytes)).toEqual(await readFile(path.join(repositoryRoot, 'content/skills', filename)));
      }
    }
  });
});
