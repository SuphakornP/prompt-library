import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck,
  ChevronDown, Code2, Copy, ExternalLink, FileText, Lightbulb, ListFilter,
  MessageSquare, PanelTop, PenLine, RotateCcw, Search, Shapes, Sparkles,
  Target, Users, X, ChartNoAxesCombined, Compass, FolderOpen, CircleHelp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import rawCatalog from './data/catalog.json';
import type { CatalogEntry } from './types';
import { chatgptPromptUrl, draftKey, filterCatalog, filterSearch, readFilters } from './lib/library';
import type { LibraryFilters } from './lib/library';
import SkillDiscovery from './components/SkillDiscovery';
import type { DiscoveryAnswers } from './discovery-types';
import { completion } from './lib/skill-discovery';

const catalog: CatalogEntry[] = rawCatalog;
const departments = [...new Set(catalog.flatMap((entry) => entry.departments))].sort();
const tasks = [...new Set(catalog.flatMap((entry) => entry.tags))].sort();
const quickDepartments = ['Marketing', 'Sales', 'Operations', 'Engineering', 'Education'];
const emptyFilters: LibraryFilters = { query: '', department: '', task: '' };
const departmentIcons: Record<string, LucideIcon> = {
  General: Sparkles, Marketing: Target, Sales: MessageSquare, Operations: Shapes,
  Engineering: Code2, Education: BookOpen, Research: Compass, Finance: ChartNoAxesCombined,
  Data: ChartNoAxesCombined, Design: PenLine, Product: PanelTop, HR: Users,
  Legal: FileText, Personal: Lightbulb, Security: Code2, Science: Compass,
};

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <img className="brand" src={`/brand/fellow-prompt${inverse ? '-inverse' : ''}.svg`} alt="Fellow Prompt" width="124" height="48" />;
}

function PreparationList({ items }: { items: string[] }) {
  return <ul>{(items.length ? items : ['A clear idea of your goal and any useful context.']).map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className="modal" aria-label={title} onCancel={onClose}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner">
      <button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={20} /></button>
      <h2>{title}</h2>{children}
    </div>
  </dialog>;
}

export default function App() {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search }));
  const [visibleCount, setVisibleCount] = useState(24);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<DiscoveryAnswers>({});
  const [discoveryTask, setDiscoveryTask] = useState('');
  const [librarySearch, setLibrarySearch] = useState(() => filterSearch(readFilters(window.location.search)));
  const searchInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const listScroll = useRef(0);
  const lastCard = useRef<string | null>(null);
  const copyRevision = useRef(0);
  const previousPath = useRef(location.pathname);
  const filters = useMemo(() => readFilters(librarySearch), [librarySearch]);
  const filtered = useMemo(() => filterCatalog(catalog, filters), [filters]);
  const slug = location.pathname.startsWith('/prompts/') ? location.pathname.slice('/prompts/'.length).replace(/\/$/, '') : '';
  const entry = catalog.find((item) => item.slug === slug);
  const isLibrary = location.pathname === '/';
  const isDiscovery = location.pathname === '/discover' || location.pathname.startsWith('/discover/');
  const fromSkills = new URLSearchParams(location.search).get('from') === 'skills';
  const discoveryHref = completion(discoveryAnswers).complete ? '/discover/result' : '/discover';
  const activeFilters = Boolean(filters.query || filters.department || filters.task);

  useEffect(() => {
    const onPop = () => {
      setLocation({ pathname: window.location.pathname, search: window.location.search });
      if (window.location.pathname === '/' || (window.location.pathname.startsWith('/prompts/') && new URLSearchParams(window.location.search).get('from') !== 'skills')) {
        setLibrarySearch(filterSearch(readFilters(window.location.search)));
      }
    };
    window.addEventListener('popstate', onPop);
    const shortcut = (event: KeyboardEvent) => {
      if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement) && !document.querySelector('dialog[open]')) {
        if (searchInput.current) { event.preventDefault(); searchInput.current.focus(); }
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', shortcut); };
  }, []);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    const frame = requestAnimationFrame(() => {
      if (isLibrary) {
        window.scrollTo({ top: listScroll.current, behavior: 'instant' });
        if (lastCard.current) document.getElementById(lastCard.current)?.focus({ preventScroll: true });
      } else { window.scrollTo({ top: 0, behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, isLibrary]);

  useEffect(() => { document.title = isDiscovery ? 'Skill Compass — Fellow Prompt' : entry ? `${entry.title} — Fellow Prompt` : 'Fellow Prompt — Your everyday prompt library'; }, [entry, isDiscovery]);
  useEffect(() => { setVisibleCount(24); }, [filters.query, filters.department, filters.task]);
  useEffect(() => {
    if (!toast && !copied) return;
    const timeout = window.setTimeout(() => { setToast(''); setCopied(''); }, 4500);
    return () => window.clearTimeout(timeout);
  }, [toast, copied]);

  function navigate(path: string, event?: MouseEvent<HTMLAnchorElement>) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    event?.preventDefault();
    if (isLibrary) listScroll.current = window.scrollY;
    window.history.pushState({ fellowPrompt: true }, '', path);
    setLocation({ pathname: window.location.pathname, search: window.location.search });
  }

  function changeFilters(next: Partial<LibraryFilters>) {
    const search = filterSearch({ ...filters, ...next });
    window.history.replaceState(window.history.state, '', `/${search}`);
    setLibrarySearch(search);
    setLocation({ pathname: '/', search });
  }

  function promptText(item: CatalogEntry, stepIndex = 0) {
    const step = item.steps[stepIndex];
    return drafts[draftKey(item.id, step.id)] ?? step.prompt;
  }

  function updateDraft(key: string, text?: string) {
    copyRevision.current += 1;
    setDrafts((current) => {
      const next = { ...current };
      if (text === undefined) delete next[key];
      else next[key] = text;
      return next;
    });
    if (copied === key) { setCopied(''); setToast(''); }
  }

  async function copy(text: string, key: string) {
    if (!text.trim()) return;
    const revision = ++copyRevision.current;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (revision !== copyRevision.current) return;
      setCopied(key);
      setToast('Prompt copied. Make it your own.');
    } catch {
      if (revision !== copyRevision.current) return;
      setManualCopy(text);
      setToast('Your browser could not copy the prompt. Select and copy it below.');
    }
  }

  const libraryHref = `/${librarySearch}`;
  const chatgptHref = entry ? chatgptPromptUrl(promptText(entry)) : null;
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <a className="brand-link" href={libraryHref} onClick={(event) => navigate(libraryHref, event)} aria-label="Fellow Prompt home"><Brand inverse /></a>
      <nav aria-label="Main navigation">
        <a className={!isDiscovery ? 'nav-active' : ''} aria-current={!isDiscovery ? 'page' : undefined} href={libraryHref} onClick={(event) => navigate(libraryHref, event)}><Shapes size={16} />Explore prompts</a>
        <a className={isDiscovery ? 'nav-active' : ''} aria-current={isDiscovery ? 'page' : undefined} href={discoveryHref} onClick={(event) => navigate(discoveryHref, event)}><Compass size={16} />Find your skills</a>
        <button onClick={() => setHelpOpen(true)}><CircleHelp size={16} />How it works</button>
      </nav>
      <span className="header-note"><span className="status-dot" />A little help. A head start.</span>
    </header>

    <main id="main" className="main-shell">
      {isDiscovery ? <SkillDiscovery pathname={location.pathname} answers={discoveryAnswers} task={discoveryTask} onAnswersChange={setDiscoveryAnswers} onTaskChange={setDiscoveryTask} navigate={navigate} onCopy={(text, key) => void copy(text, key)} copied={copied} /> : isLibrary ? <>
        <section className="library-intro" aria-labelledby="library-title">
          <div>
            <div className="eyebrow"><span className="tiny-spark" aria-hidden="true">✳</span> YOUR EVERYDAY PROMPT LIBRARY</div>
            <h1 id="library-title">Find your next<br className="mobile-break" /> <span>starting point.</span></h1>
            <p>Practical prompts for the work in front of you.<br className="mobile-break" /> Find one, make it yours, and get going.</p>
          </div>
          <div className="intro-art" aria-hidden="true"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><img src="/brand/mark.svg" alt="" /><span className="art-star">✳</span><span className="art-dot" /></div>
        </section>

        <a className="compass-library-entry" href={discoveryHref} onClick={(event) => navigate(discoveryHref, event)}><Compass size={23} strokeWidth={1.4} /><span><strong>Not sure where to start?</strong> Find your working style and a skill to download.</span><span className="compass-entry-action">Find my skills <ArrowRight size={16} /></span></a>

        <section aria-label="Find prompts" className="discovery">
          <div className="search-box">
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="prompt-search">Search prompts</label>
            <input ref={searchInput} id="prompt-search" type="search" placeholder="What would you like to work on?" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} />
            {filters.query ? <button className="icon-button" aria-label="Clear search" onClick={() => { changeFilters({ query: '' }); searchInput.current?.focus(); }}><X size={18} /></button> : <kbd>/</kbd>}
          </div>
          <div className="department-row" aria-label="Filter by department">
            <div className="department-tabs">
              <button className={!filters.department ? 'selected' : ''} aria-pressed={!filters.department} onClick={() => changeFilters({ department: '' })}><Shapes size={15} />All prompts</button>
              {quickDepartments.filter((department) => departments.includes(department)).map((department) => <button key={department} className={filters.department === department ? 'selected' : ''} aria-pressed={filters.department === department} onClick={() => changeFilters({ department })}>{department}</button>)}
            </div>
            <div className="select-wrap department-select">
              <label className="sr-only" htmlFor="department-select">All departments</label>
              <select id="department-select" value={filters.department} onChange={(event) => changeFilters({ department: event.target.value })}>
                <option value="">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}
              </select><ChevronDown size={14} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="catalog-section" aria-label="Prompt catalog">
          <div className="results-bar">
            <div className="results-title"><h2>{filters.department || (filters.query ? 'Search results' : 'Explore the library')}</h2><span className="result-count" aria-live="polite">{filtered.length} prompts</span>{activeFilters && <button className="clear-filters" onClick={() => changeFilters(emptyFilters)}>Clear filters <X size={12} /></button>}</div>
            <div className="result-controls"><span className="sort-label">A–Z</span><div className="select-wrap task-select"><ListFilter size={15} aria-hidden="true" /><label className="sr-only" htmlFor="task-select">Task type</label><select id="task-select" value={filters.task} onChange={(event) => changeFilters({ task: event.target.value })}><option value="">All task types</option>{tasks.map((task) => <option key={task}>{task}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></div></div>
          </div>

          {filtered.length ? <div className="prompt-grid" key={librarySearch}>
            {filtered.slice(0, visibleCount).map((item, index) => {
              const department = item.departments[0] || 'General';
              const Icon = departmentIcons[department] || Sparkles;
              const key = draftKey(item.id, item.steps[0].id);
              return <article className="prompt-card" key={item.id} style={{ animationDelay: `${Math.min(index % 24, 8) * 25}ms` }}>
                <div className="card-top"><span className={`category-icon tone-${['Marketing', 'Sales', 'Design'].includes(department) ? 'amber' : ['Engineering', 'Data', 'Research', 'Science'].includes(department) ? 'blue' : 'green'}`}><Icon size={21} strokeWidth={1.6} /></span><span className="card-department">{department}</span><span className="card-open-icon" aria-hidden="true"><ArrowUpRight size={18} /></span></div>
                <a id={`card-${item.id}`} className="card-title-link" href={`/prompts/${item.slug}${librarySearch}`} onClick={(event) => { lastCard.current = `card-${item.id}`; navigate(`/prompts/${item.slug}${librarySearch}`, event); }}><h3>{item.title}</h3></a>
                <p className="card-summary">{item.summary}</p>
                <div className="card-bottom"><span className="task-label">{item.tags[0] || 'General'}{item.steps.length > 1 && <span className="step-count">· {item.steps.length} steps</span>}</span><button className={`copy-button ${copied === key ? 'copied' : ''}`} disabled={!promptText(item).trim()} onClick={() => void copy(promptText(item), key)} aria-label={`Copy prompt: ${item.title}`}>{copied === key ? <Check size={14} /> : <Copy size={14} />}{copied === key ? 'Copied' : 'Copy prompt'}</button></div>
              </article>;
            })}
          </div> : <div className="empty-state"><Search size={32} strokeWidth={1.3} /><h3>No prompts found. A fresh start?</h3><p>Try a different keyword or clear a filter to explore more.</p><button className="button button-primary" onClick={() => changeFilters(emptyFilters)}>Explore all prompts <ArrowRight size={16} /></button></div>}

          {filtered.length > visibleCount && <div className="load-more"><p>Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} prompts</p><button className="button button-outline" onClick={() => setVisibleCount((count) => count + 24)}>Load more prompts <ArrowDown size={16} /></button></div>}
        </section>
        <div className="library-end"><img src="/brand/mark.svg" alt="" width="24" height="28" /><p>A starting point, never a final word.<br /><span>The best prompts have a little of you in them.</span></p></div>
      </> : entry ? <>
        <a className="back-link" href={fromSkills ? discoveryHref : libraryHref} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; if (fromSkills) navigate(discoveryHref, event); else if (window.history.state?.fellowPrompt) { event.preventDefault(); window.history.back(); } else navigate(libraryHref, event); }}><ArrowLeft size={15} />{fromSkills ? 'Back to your skills' : 'Back to the library'}</a>
        <div className="detail-heading"><div className="eyebrow">{entry.departments.join(' / ')}</div><h1 tabIndex={-1} ref={heading}>{entry.title}</h1><p>{entry.summary}</p><div className="detail-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}<span>{entry.steps.length === 1 ? 'One prompt. Your starting point.' : `${entry.steps.length} steps · One conversation`}</span></div></div>
        <details className="mobile-preparation"><summary><FolderOpen size={17} />Before you start<ChevronDown size={15} /></summary><PreparationList items={entry.prerequisites} /></details>
        <div className="detail-layout">
          <div className="prompt-workspace">
            {entry.steps.map((step, index) => {
              const key = draftKey(entry.id, step.id);
              const text = promptText(entry, index);
              const modified = text !== step.prompt;
              return <section className="prompt-editor" key={key} aria-labelledby={`step-${step.id}`}>
                <div className="editor-heading"><div><span className="step-number">{String(index + 1).padStart(2, '0')}</span><h2 id={`step-${step.id}`}>{step.title}</h2></div>{modified && <span className="edited-label">Edited by you</span>}</div>
                <p className="step-instruction">{step.instruction || (index === 0 ? 'Add your context or adjust the details before you use this prompt.' : 'Continue in the same conversation after the previous step.')}</p>
                <label className="sr-only" htmlFor={`prompt-${step.id}`}>Edit prompt: {step.title}</label>
                <textarea id={`prompt-${step.id}`} value={text} spellCheck={false} onChange={(event) => updateDraft(key, event.target.value)} rows={Math.max(8, Math.min(20, text.split('\n').length + Math.ceil(text.length / 100)))} />
                <div className="editor-toolbar"><span>{text.length.toLocaleString()} characters</span><button disabled={!modified} onClick={() => updateDraft(key)}><RotateCcw size={13} />Reset prompt</button></div>
                <div className="editor-actions"><button className="button button-primary" disabled={!text.trim()} onClick={() => void copy(text, key)}>{copied === key ? <CheckCheck size={16} /> : <Copy size={16} />}{copied === key ? 'Prompt copied' : 'Copy prompt'}</button>{index === 0 && <a className="button button-outline" role="link" href={chatgptHref ?? undefined} aria-disabled={!chatgptHref || undefined} tabIndex={chatgptHref ? undefined : -1} target="_blank" rel="noopener noreferrer" title="Open ChatGPT in a new tab with this prompt filled in">Try in ChatGPT <ArrowUpRight size={17} /></a>}{index > 0 && <span className="same-chat-note"><MessageSquare size={14} />Paste into the same chat</span>}</div>
              </section>;
            })}
            <p className="draft-note"><PenLine size={14} />Your edits stay here while you browse. Refreshing the page resets them.</p>
          </div>
          <aside className="detail-aside">
            <section className="context-section preparation-desktop"><div className="aside-icon"><FolderOpen size={20} strokeWidth={1.6} /></div><h2>Before you start</h2><PreparationList items={entry.prerequisites} /></section>
            <section className="context-section"><div className="aside-icon"><Target size={20} strokeWidth={1.6} /></div><h2>What you’ll get</h2><p>{entry.outcome}</p></section>
            <section className="try-note"><span className="tiny-spark" aria-hidden="true">✳</span><h2>Try in ChatGPT</h2><p>Open ChatGPT with your edited prompt already filled in. Review it, add any required files, then send when ready.</p><p className="small-note">Your files and chat history aren’t transferred. Check the response before using it.</p><a role="link" href={chatgptHref ?? undefined} aria-disabled={!chatgptHref || undefined} tabIndex={chatgptHref ? undefined : -1} target="_blank" rel="noopener noreferrer">Try in ChatGPT <ExternalLink size={13} /></a></section>
          </aside>
        </div>
      </> : <section className="empty-state not-found"><Compass size={38} /><h1 tabIndex={-1} ref={heading}>This prompt isn’t in the library.</h1><p>Let’s find another starting point.</p><a className="button button-primary" href="/" onClick={(event) => navigate('/', event)}>Explore prompts <ArrowRight size={16} /></a></section>}
    </main>
    <footer className="site-footer"><span>Thoughtfully collected. Ready to make your own.</span><span>Made with care by <strong>Fellow Intelligence</strong><span className="footer-spark" aria-hidden="true">✳</span></span></footer>
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <>{manualCopy !== null ? <CircleHelp size={17} /> : <Check size={17} />}<span>{toast}</span></>}</div>
    {manualCopy !== null && <Modal title="Copy your prompt" onClose={() => setManualCopy(null)}><p>Clipboard access isn’t available. Select the text, then use ⌘C or Ctrl+C to copy.</p><textarea className="manual-copy" readOnly autoFocus value={manualCopy} onFocus={(event) => event.target.select()} aria-label="Prompt to copy manually" /><button className="button button-primary" onClick={() => setManualCopy(null)}>Done</button></Modal>}
    {helpOpen && <Modal title="A good prompt is a starting point." onClose={() => setHelpOpen(false)}><div className="how-steps"><div><span>01</span><section><h3>Find your task</h3><p>Search the library or explore by department and type of work.</p></section></div><div><span>02</span><section><h3>Make it yours</h3><p>Open a prompt, check what you need, and add your context. Replace placeholders with your own details.</p></section></div><div><span>03</span><section><h3>Copy, try, refine</h3><p>Use Try in ChatGPT to open a new chat with your prompt filled in, or Copy to use another AI tool. Review your prompt before sending. For a multi-step workflow, keep the follow-ups in the same conversation.</p></section></div></div><p className="help-note">Some tasks need files or connected tools. The library tells you what to prepare; it doesn’t upload files or run prompts for you.</p><button className="button button-primary" onClick={() => setHelpOpen(false)}>Find a prompt <ArrowRight size={16} /></button></Modal>}
  </>;
}
