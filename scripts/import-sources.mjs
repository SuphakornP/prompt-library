import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parse } from 'acorn';
import { load } from 'cheerio';

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const refresh = process.argv.includes('--refresh');
const sourceArgument = process.argv.find((arg) => arg.startsWith('--source='));
const selectedSource = sourceArgument?.split('=')[1] ?? 'all';
if (!['all', 'chatgpt', 'claude'].includes(selectedSource)) {
  throw new Error('Use --source=all, --source=chatgpt, or --source=claude.');
}
const concurrency = 3;
const evidence = new Map();

function clean(text) {
  return String(text ?? '').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function unique(items) {
  return [...new Set(items.map(clean).filter(Boolean))];
}

async function fetchPublic(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !['learn.chatgpt.com', 'academy.claude.com'].includes(parsed.hostname)) {
    throw new Error(`Unexpected source URL: ${url}`);
  }
  const { stdout } = await execFileAsync('curl', [
    '--fail', '--silent', '--show-error', '--location', '--max-time', '45',
    '--retry', '2', '--retry-delay', '1', '--proto', '=https', '--proto-redir', '=https', url,
  ], { maxBuffer: 25 * 1024 * 1024 });
  evidence.set(url, { url, sha256: createHash('sha256').update(stdout).digest('hex'), bytes: Buffer.byteLength(stdout) });
  return stdout;
}

async function atomicJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, path);
}

async function existingRecords(source) {
  try {
    const records = JSON.parse(await readFile(resolve(root, `content/raw/${source}.json`), 'utf8'));
    const inventory = JSON.parse(await readFile(resolve(root, `content/provenance/${source}-inventory.json`), 'utf8'));
    for (const resource of inventory.fetchedResources ?? []) {
      if (!evidence.has(resource.url)) evidence.set(resource.url, resource);
    }
    return new Map(records.map((record) => [record.sourceId, record]));
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
}

async function mapConcurrent(items, mapper) {
  const output = new Array(items.length);
  let index = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const current = index++;
      output[current] = await mapper(items[current], current);
    }
  }));
  return output;
}

function walk(node, visitor) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visitor(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'start' || key === 'end') continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visitor));
    else if (value && typeof value === 'object') walk(value, visitor);
  }
}

function propertyName(node) {
  return node?.type === 'Identifier' ? node.name : node?.value;
}

function property(node, key) {
  return node?.type === 'ObjectExpression'
    ? node.properties.find((entry) => entry.type === 'Property' && propertyName(entry.key) === key)?.value
    : undefined;
}

// Only literal data is decoded. Fetched JavaScript is never evaluated.
function staticValue(node) {
  if (!node) return undefined;
  if (node.type === 'Literal') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis.map((item) => item.value.cooked).join('');
  if (node.type === 'ArrayExpression') return node.elements.map(staticValue);
  if (node.type === 'ObjectExpression') {
    const entries = node.properties.filter((entry) => entry.type === 'Property' && !entry.computed)
      .map((entry) => [propertyName(entry.key), staticValue(entry.value)]);
    return Object.fromEntries(entries);
  }
  if (node.type === 'UnaryExpression' && node.operator === '!') return !staticValue(node.argument);
  if (node.type === 'UnaryExpression' && node.operator === '-') return -staticValue(node.argument);
  return undefined;
}

function deduplicatePrompts(prompts) {
  const seen = new Set();
  return prompts.flatMap(({ label, text }) => {
    const normalized = clean(text);
    const key = normalized.replace(/\s+/g, '').toLowerCase();
    if (!normalized || seen.has(key)) return [];
    seen.add(key);
    return [{ label: seen.size === 1 ? 'Starter prompt' : clean(label) || 'Follow-up prompt', text: normalized }];
  });
}

function documentBody($) {
  const candidates = $('main, article');
  const main = candidates.length ? candidates.first().clone() : $('body').clone();
  main.find('script, style, nav, aside, footer, button, svg, [aria-hidden="true"], [data-use-case-starter-prompt-print]').remove();
  main.find('h1,h2,h3,h4,p,li,pre,section,table').each((_, element) => {
    $(element).prepend('\n').append('\n');
  });
  return clean(main.text()).replace(/\nLoading\n/g, '\n');
}

function prerequisiteSections($) {
  const prerequisites = [];
  $('h2,h3').each((_, heading) => {
    const title = clean($(heading).text()).replace(/[\ue000-\uf8ff]/g, '');
    if (!/before you start|set.up|working folder|required context|give .+ context|connect your tools|skills & plugins/i.test(title)) return;
    const chunks = [];
    let sibling = heading.nextSibling;
    while (sibling && !/^h[123]$/.test(sibling.tagName ?? '')) {
      const node = $(sibling).clone();
      node.find('button,svg,[aria-hidden="true"]').remove();
      chunks.push(node.text());
      sibling = sibling.nextSibling;
    }
    const text = clean(chunks.join('\n'));
    if (text && text !== 'Loading') prerequisites.push(`${title}: ${text}`);
  });
  return unique(prerequisites);
}

function chatgptPrompts($) {
  const prompts = [];
  let label = 'Starter prompt';
  $('h2,h3,h4,.prompt-scroll__content,astro-island').each((_, element) => {
    const node = $(element);
    if (/^h[234]$/.test(element.tagName)) {
      label = clean(node.text());
    } else if (node.hasClass('prompt-scroll__content')) {
      prompts.push({ label, text: node.text() });
    } else if (node.attr('props')) {
      const props = JSON.parse(node.attr('props'));
      const text = props.copyValue?.[1] ?? props.prompt?.[1];
      if (typeof text === 'string' && (props['aria-label']?.[1] === 'Copy prompt' || props.prompt)) prompts.push({ label, text });
    }
  });
  return deduplicatePrompts(prompts);
}

async function importChatgpt() {
  const indexUrl = 'https://learn.chatgpt.com/use-cases';
  const indexHtml = await fetchPublic(indexUrl);
  const $ = load(indexHtml);
  const entries = new Map();
  $('[data-codex-use-case-card]').each((_, card) => {
    const node = $(card);
    const href = node.find('a[href]').first().attr('href');
    if (!/^\/use-cases\/[^/]+\/?$/.test(href ?? '') || href.includes('/collections')) return;
    const slug = href.split('/').filter(Boolean).at(-1);
    if (entries.has(slug)) return;
    entries.set(slug, {
      sourceId: `chatgpt:${slug}`, source: 'chatgpt', url: new URL(href, indexUrl).href,
      title: clean(node.find('h3').first().text()), summary: clean(node.find('p').first().text()),
      departments: [], tags: unique(node.find('span').map((_, item) => $(item).text()).get()),
    });
  });
  if (!entries.size) throw new Error('ChatGPT index selectors found no source records.');
  const existing = await existingRecords('chatgpt');
  const records = await mapConcurrent([...entries.values()], async (entry, index) => {
    const cached = existing.get(entry.sourceId);
    if (!refresh && cached?.status === 'available') return { ...cached, prompts: deduplicatePrompts(cached.prompts) };
    const retrievedAt = new Date().toISOString();
    try {
      const html = await fetchPublic(entry.url);
      const article = load(html);
      const body = documentBody(article);
      const prompts = chatgptPrompts(article);
      if (!body) throw new Error('Article extraction produced an empty body.');
      if ((index + 1) % 20 === 0) console.log(`ChatGPT ${index + 1}/${entries.size}`);
      return { ...entry, prerequisites: prerequisiteSections(article), prompts, body, retrievedAt, status: 'available' };
    } catch (error) {
      console.error(`Unavailable ${entry.url}: ${error.message}`);
      return { ...entry, prerequisites: [], prompts: [], body: '', retrievedAt, status: 'unavailable', reason: error.message };
    }
  });
  await atomicJson(resolve(root, 'content/raw/chatgpt.json'), records);
  return { source: 'chatgpt', indexUrl, discovered: entries.size, available: records.filter((record) => record.status === 'available').length, records };
}

async function discoverClaudeBundle() {
  const indexUrl = 'https://academy.claude.com/use-cases';
  const html = await fetchPublic(indexUrl);
  const $ = load(html);
  const libraryPath = $('link[href]').map((_, node) => $(node).attr('href')).get().find((href) => /\/library-[^/]+\.js$/.test(href));
  if (!libraryPath) throw new Error('Claude catalog library bundle was not found.');
  const libraryUrl = new URL(libraryPath, indexUrl).href;
  const library = await fetchPublic(libraryUrl);
  const bundlePath = library.match(/from["']([^"']*use-cases-[^"']+\.js)["']/)?.[1];
  if (!bundlePath) throw new Error('Claude use-case metadata import was not found.');
  const bundleUrl = new URL(bundlePath, libraryUrl).href;
  const bundle = await fetchPublic(bundleUrl);
  const ast = parse(bundle, { ecmaVersion: 'latest', sourceType: 'module' });
  const metadata = new Map();
  const moduleToMetadata = new Map();
  const slugToModule = new Map();
  walk(ast, (node) => {
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
      if (staticValue(property(node.init, 'kind')) === 'use-case') metadata.set(node.id.name, staticValue(node.init));
      if (node.init?.type === 'CallExpression') {
        const pointer = property(node.init.arguments[0], 'frontmatter');
        if (pointer?.type === 'ArrowFunctionExpression' && pointer.body.type === 'Identifier') moduleToMetadata.set(node.id.name, pointer.body.name);
      }
    }
    if (node.type === 'Property' && typeof propertyName(node.key) === 'string') {
      const match = propertyName(node.key).match(/academy-content\/use-cases\/([^/]+)\/index\.mdx$/);
      if (match && node.value.type === 'Identifier') slugToModule.set(match[1], node.value.name);
    }
  });
  const contentPaths = new Map([...bundle.matchAll(/(assets\/v1\/content\/use-cases\/([^/]+)\/index-[^"'\s]+\.js)/g)].map((match) => [match[2], new URL(`/${match[1]}`, indexUrl).href]));
  const entries = [...slugToModule].map(([slug, moduleId]) => {
    const meta = metadata.get(moduleToMetadata.get(moduleId));
    if (!meta) throw new Error(`Claude metadata could not be resolved for ${slug}.`);
    return { slug, meta, contentUrl: contentPaths.get(slug) };
  }).filter(({ meta }) => meta.shared.status === 'published' && meta.visibility === 'public');
  if (!entries.length) throw new Error('No published Claude use cases were found.');
  return { entries, indexUrl, bundleUrl };
}

function claudeHtmlPrompts($, starter) {
  const prompts = starter ? [{ label: 'Starter prompt', text: starter }] : [];
  let label = 'Starter prompt';
  $('h2,h3,h4,div').each((_, element) => {
    const node = $(element);
    if (/^h[234]$/.test(element.tagName)) label = clean(node.text()).replace(/[\ue000-\uf8ff]/g, '');
    if ((node.attr('class') ?? '').split(' ').includes('group/prompt')) {
      const content = node.children('div').first().children('div').first().clone();
      content.find('button,svg,[aria-hidden="true"]').remove();
      content.find('p,li,pre').append('\n');
      prompts.push({ label, text: content.text() });
    }
  });
  return deduplicatePrompts(prompts);
}

function contentModulePrompts(moduleText) {
  const ast = parse(moduleText, { ecmaVersion: 'latest', sourceType: 'module' });
  const prompts = [];
  const setup = [];
  let label = 'Starter prompt';
  walk(ast, (node) => {
    if (node.type !== 'ObjectExpression') return;
    const id = staticValue(property(node, 'id'));
    const children = staticValue(property(node, 'children'));
    if (id && typeof children === 'string') label = children;
    const prompt = staticValue(property(node, 'prompt'));
    if (typeof prompt === 'string') prompts.push({ label, text: prompt });
    if (staticValue(property(node, 'name')) === 'UseCaseSetupV2') {
      for (const item of staticValue(property(node, 'items')) ?? []) {
        if (item.text) setup.push(`${item.title ?? item.kind}: ${item.text}`);
        for (const tool of item.tools ?? []) setup.push(`${tool.names}${tool.required ? ' (required)' : ''}: ${tool.text ?? ''}`);
      }
    }
  });
  return { prompts: deduplicatePrompts(prompts), setup };
}

async function importClaude() {
  const { entries, indexUrl, bundleUrl } = await discoverClaudeBundle();
  const existing = await existingRecords('claude');
  const records = await mapConcurrent(entries, async ({ slug, meta, contentUrl }, index) => {
    const sourceId = `claude:${slug}`;
    const cached = existing.get(sourceId);
    if (!refresh && cached?.status === 'available') return { ...cached, prompts: deduplicatePrompts(cached.prompts) };
    const entry = {
      sourceId, source: 'claude', url: `https://academy.claude.com/use-cases/${slug}`,
      title: meta.shared.title, summary: meta.shared.summary,
      departments: meta.shared.departments ?? [], tags: meta.shared.tags ?? [],
    };
    const retrievedAt = new Date().toISOString();
    try {
      const html = await fetchPublic(entry.url);
      const $ = load(html);
      let prompts = claudeHtmlPrompts($, meta.typed?.tryPrompt);
      const prerequisites = prerequisiteSections($);
      for (const name of meta.typed?.connectors?.required ?? []) prerequisites.push(`Required connector: ${name}`);
      for (const name of meta.typed?.features ?? []) prerequisites.push(`Source workflow capability: ${name}`);
      let body = documentBody($);
      if (!meta.typed?.tryPrompt && contentUrl) {
        const moduleText = await fetchPublic(contentUrl);
        const extracted = contentModulePrompts(moduleText);
        prompts = deduplicatePrompts([...prompts, ...extracted.prompts]);
        prerequisites.push(...extracted.setup);
        if (extracted.prompts.length) body += `\n\nPrompts from public article components:\n${extracted.prompts.map((prompt) => `${prompt.label}\n${prompt.text}`).join('\n\n')}`;
      }
      if (!body) throw new Error('Article extraction produced an empty body.');
      if ((index + 1) % 20 === 0) console.log(`Claude ${index + 1}/${entries.length}`);
      return { ...entry, prerequisites: unique(prerequisites), prompts, body, retrievedAt, status: 'available' };
    } catch (error) {
      console.error(`Unavailable ${entry.url}: ${error.message}`);
      return { ...entry, prerequisites: [], prompts: [], body: '', retrievedAt, status: 'unavailable', reason: error.message };
    }
  });
  await atomicJson(resolve(root, 'content/raw/claude.json'), records);
  return { source: 'claude', indexUrl, bundleUrl, discovered: entries.length, available: records.filter((record) => record.status === 'available').length, records };
}

const runs = [];
if (selectedSource === 'all' || selectedSource === 'chatgpt') {
  const result = await importChatgpt();
  runs.push(result);
  console.log(`ChatGPT raw catalog ready: ${result.available}/${result.discovered} available.`);
}
if (selectedSource === 'all' || selectedSource === 'claude') {
  const result = await importClaude();
  runs.push(result);
  console.log(`Claude raw catalog ready: ${result.available}/${result.discovered} available.`);
}
for (const run of runs) {
  await atomicJson(resolve(root, `content/provenance/${run.source}-inventory.json`), {
    source: run.source, indexUrl: run.indexUrl, ...(run.bundleUrl ? { metadataBundleUrl: run.bundleUrl } : {}),
    retrievedAt: new Date().toISOString(), discovered: run.discovered, available: run.available,
    unavailable: run.discovered - run.available,
    entries: run.records.map(({ sourceId, url, status, reason }) => ({ sourceId, url, status, ...(reason ? { reason } : {}) })),
    fetchedResources: [...evidence.values()].filter((item) => new URL(item.url).hostname === new URL(run.indexUrl).hostname),
  });
}
if (runs.some((run) => run.available !== run.discovered)) process.exitCode = 2;
