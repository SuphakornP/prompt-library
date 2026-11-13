import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCheck, Compass, Copy, FileText, RotateCcw, Sparkles } from 'lucide-react';
import { questions, skills, styles } from '../data/discovery';
import downloads from '../data/skill-downloads.json';
import { completion, isQuestionAnswered, normalizeSelection, profile, recommendations } from '../lib/skill-discovery';
import type { DiscoveryAnswers, SkillDefinition } from '../discovery-types';

interface Props {
  pathname: string;
  answers: DiscoveryAnswers;
  task: string;
  onAnswersChange: (answers: DiscoveryAnswers) => void;
  onTaskChange: (task: string) => void;
  navigate: (path: string, event?: MouseEvent<HTMLAnchorElement>) => void;
  onCopy: (text: string, key: string) => void;
  copied: string;
}

function InstallationGuide({ platform, skill }: { platform: string; skill: SkillDefinition }) {
  return <div className="skill-install">
    <h4>Use this skill with {platform === 'chatgpt' ? 'ChatGPT or Codex' : platform === 'claude' ? 'Claude' : 'your AI tool'}</h4>
    {platform === 'chatgpt' ? <>
      <p>ChatGPT and Codex are OpenAI tools, and both support skills. The setup depends on where you use them.</p>
      <h4>Install the download in a Codex workspace</h4>
      <ol>
      <li>Download and unzip the package.</li>
      <li>Place the <code>{skill.id}</code> folder in your project’s <code>.agents/skills/</code> folder, or <code>~/.agents/skills/</code> for personal use.</li>
      <li>Open Codex in that project, check that the skill is available, and ask it to use <code>${skill.id}</code> with your own material.</li>
      </ol>
      <h4>Skills in ChatGPT</h4>
      <p>In the ChatGPT desktop app, open Skills in the sidebar to explore your available skills. This download is a local skill folder; the Codex setup above is the route verified for this package.</p>
      <p>ChatGPT also uses skills distributed through plugins on web, desktop, and mobile. This ZIP is not a plugin package. To try the task in a chat, copy the sample below; pasting it does not install the skill.</p>
    </> : platform === 'claude' ? <ol>
      <li>Check that skills and the required file capabilities are enabled for your account.</li>
      <li>Open Customize → Skills, choose the skill upload option, and upload the ZIP without unpacking it.</li>
      <li>Enable the skill and ask Claude to use <code>{skill.id}</code> with your own material.</li>
    </ol> : <p>This ZIP contains a reusable agent skill. Choose ChatGPT / Codex or Claude above for setup guidance, or check your tool’s skill installation instructions. You can also copy the sample below to try the task in a chat; pasting it does not install the skill.</p>}
    <p className="skill-install-note">The package is checked for structure and reviewed with sample tasks. Installation in your account depends on your tool and organization settings.</p>
    <div className="skill-doc-links"><a href="https://learn.chatgpt.com/docs/build-skills" target="_blank" rel="noopener noreferrer">OpenAI skill setup <ArrowUpRight size={12} /></a><a href="https://support.claude.com/en/articles/12512180-use-skills-in-claude" target="_blank" rel="noopener noreferrer">Claude instructions <ArrowUpRight size={12} /></a></div>
  </div>;
}

export default function SkillDiscovery({ pathname, answers, task, onAnswersChange, onTaskChange, navigate, onCopy, copied }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const progress = completion(answers);
  const firstMissing = questions.findIndex((question) => !isQuestionAnswered(question.id, answers));
  const resumeHref = firstMissing < 0 ? '/discover/review' : `/discover/${firstMissing + 1}`;
  const match = /^\/discover\/(\d+)(\/edit)?\/?$/.exec(pathname);
  const step = match ? Number(match[1]) - 1 : -1;
  const editing = match?.[2] === '/edit';
  const question = questions[step];
  const isReview = pathname === '/discover/review';
  const isResult = pathname === '/discover/result';
  const canShowStep = question && questions.slice(0, step).every((item) => isQuestionAnswered(item.id, answers));
  const needsSession = ((isReview || isResult) && !progress.complete) || (Boolean(match) && !canShowStep);
  const platform = answers.platform?.[0] ?? 'unknown';

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [pathname]);

  function restart() {
    onAnswersChange({});
    onTaskChange('');
    navigate('/discover/1');
  }

  if (needsSession) return <section className="compass-empty">
    <Compass size={40} strokeWidth={1.3} />
    <h1 ref={heading} tabIndex={-1}>Let’s find your starting point.</h1>
    <p>{progress.answered ? 'Finish your answers to see your recommendations.' : 'Your answers stay in this tab while you browse. Refreshing or opening a new tab starts a fresh survey.'}</p>
    <a className="button button-primary" href={resumeHref} onClick={(event) => navigate(resumeHref, event)}>{progress.answered ? 'Continue survey' : 'Start the survey'} <ArrowRight size={16} /></a>
  </section>;

  if (canShowStep) {
    const selected = answers[question.id] ?? [];
    const isStyle = ['start', 'output', 'team'].includes(question.id);
    const backHref = editing ? '/discover/review' : step ? `/discover/${step}` : '/discover';
    return <section className="compass-survey">
      <div className="compass-progress"><span>SKILL COMPASS</span><span>{String(step + 1).padStart(2, '0')} <span className="compass-muted">/ {String(questions.length).padStart(2, '0')}</span></span><progress aria-label="Survey progress" value={step + 1} max={questions.length} /></div>
      <div className="compass-survey-layout">
        <aside className="compass-context"><Compass size={31} strokeWidth={1.3} /><p className="eyebrow">{question.section}</p><p>Think about the work in front of you. There are no right or wrong answers.</p><span>Answers stay in this tab.<br />Refreshing starts over.</span></aside>
        <div className="compass-question" key={question.id}>
          <h1 id="discovery-title" ref={heading} tabIndex={-1}>{question.title}</h1>
          <p id="question-help" className="compass-description">{question.description}</p>
          <fieldset className="compass-options" aria-labelledby="discovery-title" aria-describedby="question-help">
            <legend className="sr-only">{question.title}</legend>
            {question.options.map((option) => {
              const rank = selected.indexOf(option.id);
              return <label key={option.id} className={`compass-option ${rank >= 0 ? 'is-selected' : ''}`}>
                <input type={question.maxSelections === 1 ? 'radio' : 'checkbox'} name={question.id} value={option.id} checked={rank >= 0}
                  onChange={() => onAnswersChange({ ...answers, [question.id]: normalizeSelection(question.id, selected, option.id) })} />
                <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
                {rank >= 0 && <span className="compass-choice-mark">{isStyle && option.id !== 'unknown' ? <><span className="sr-only">{rank === 0 ? 'First choice' : 'Second choice'}</span><span aria-hidden="true">{rank + 1}</span></> : <Check size={14} aria-hidden="true" />}</span>}
              </label>;
            })}
          </fieldset>
          <p className="compass-selection-note" aria-live="polite">{isStyle ? selected.length && selected[0] !== 'unknown' ? selected.map((id, index) => `${index === 0 ? 'First' : 'Second'}: ${question.options.find((option) => option.id === id)?.label}.`).join(' ') + (selected.length === 2 ? ' Choosing another replaces your second choice.' : ' You can add a second choice.') : 'Choose your first instinct, then an optional second choice.' : question.maxSelections > 1 ? `Choose up to ${question.maxSelections}. Select an answer again to remove it.${selected.length === question.maxSelections ? ' Choosing another replaces your last choice.' : ''}` : 'Choose one answer to continue.'}</p>
          <div className="compass-step-actions">
            <a className="compass-text-button" href={backHref} onClick={(event) => navigate(backHref, event)}><ArrowLeft size={16} />Back</a>
            <button className="button button-primary" disabled={!isQuestionAnswered(question.id, answers)} onClick={() => navigate(editing || step === questions.length - 1 ? '/discover/review' : `/discover/${step + 2}`)}>{editing ? 'Save & review' : step === questions.length - 1 ? 'Review answers' : 'Continue'} <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    </section>;
  }

  if (isReview) return <section className="compass-review">
    <div className="eyebrow"><Compass size={16} /> BEFORE YOUR RESULTS</div>
    <h1 ref={heading} tabIndex={-1}>Does this sound like you?</h1>
    <p className="compass-description">A quick check before we find your skills. You can change any answer.</p>
    <dl className="compass-answer-list">{questions.map((item, index) => <div key={item.id}><dt>{item.title}</dt><dd>{answers[item.id]?.map((id) => item.options.find((option) => option.id === id)?.label).join(' · ')}</dd><a href={`/discover/${index + 1}/edit`} onClick={(event) => navigate(`/discover/${index + 1}/edit`, event)} aria-label={`Edit: ${item.title}`}>Edit <ArrowUpRight size={13} /></a></div>)}</dl>
    <label className="compass-task-label" htmlFor="discovery-task">One real task you’d like to try <span>Optional</span></label>
    <textarea id="discovery-task" className="compass-task" value={task} maxLength={500} rows={3} placeholder="For example: turn our weekly meeting notes into clear next steps." onChange={(event) => onTaskChange(event.target.value)} />
    <p className="compass-selection-note">A reminder for you. This text is not scored, sent to an AI service, or included in downloads.</p>
    <div className="compass-step-actions"><a className="compass-text-button" href={`/discover/${questions.length}`} onClick={(event) => navigate(`/discover/${questions.length}`, event)}><ArrowLeft size={16} />Back</a><button className="button button-primary" onClick={() => navigate('/discover/result')}>Find my skills <Sparkles size={16} /></button></div>
  </section>;

  if (isResult) {
    const result = profile(answers);
    const ranked = recommendations(answers);
    const top = ranked.slice(0, 3);
    const remaining = skills.filter((skill) => !top.some((item) => item.skill.id === skill.id));
    const styleTitle = result.kind === 'unknown' ? 'Your next task comes first.' : result.styles.length > 2 ? 'A little of several styles.' : result.styles.map((style) => style.name).join(' × ');
    return <section className="compass-results">
      <div className="compass-result-intro">
        <div><div className="eyebrow"><Compass size={16} /> YOUR WORKING STYLE</div><h1 ref={heading} tabIndex={-1}>{styleTitle}</h1><p>{result.description}</p><span className="compass-fine-print">A reflection of your answers today, not an assessment of ability.</span></div>
        <div className="compass-result-symbol" aria-hidden="true"><Compass size={88} strokeWidth={.8} /><span>YOUR NEXT<br />STARTING POINT</span></div>
      </div>
      {task && <div className="compass-task-reminder"><span>Your task</span><p>{task}</p></div>}
      <div className="compass-result-toolbar"><div><h2>Skills for the work ahead.</h2><p>Three ways to start, chosen from your goals and the material you have.</p></div><label htmlFor="skill-platform">Installation guide<select id="skill-platform" value={platform} onChange={(event) => onAnswersChange({ ...answers, platform: [event.target.value] })}>{questions.find((item) => item.id === 'platform')?.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label></div>
      <div className="compass-recommendations">{top.map((item, index) => {
        const artifact = downloads.find((download) => download.id === item.skill.id && download.version === item.skill.version);
        const sample = `${item.skill.starterPrompt}\n\n${item.skill.sampleInput}`;
        const key = `skill/${item.skill.id}`;
        const hasTaskMatch = Boolean(item.skill.goalMatches[answers.goal?.[0] ?? ''] || item.skill.painMatches[answers.pain?.[0] ?? '']);
        return <article className="skill-recommendation" key={item.skill.id} aria-labelledby={`title-${item.skill.id}`}>
          <div className="skill-recommendation-heading"><span className="skill-index">{String(index + 1).padStart(2, '0')}</span><div><span className="eyebrow">{item.readiness === 'prepare' ? 'PREPARE YOUR MATERIAL' : item.readiness === 'check' ? 'CHECK YOUR MATERIAL' : !hasTaskMatch ? 'A DIRECTION TO EXPLORE' : index === 0 ? 'YOUR STARTING POINT' : 'ANOTHER WAY FORWARD'}</span><h3 id={`title-${item.skill.id}`}>{item.skill.title}</h3></div><span className="skill-version">v{item.skill.version}</span></div>
          <p className="skill-summary">{item.skill.summary}</p>
          <div className="skill-reason"><Sparkles size={15} /><p>{item.reasons.join(' ')}</p></div>
          <dl className="skill-deliverables"><div><dt>Bring</dt><dd><ul>{item.skill.inputs.map((input) => <li key={input}>{input}</li>)}</ul></dd></div><div><dt>Take away</dt><dd>{item.skill.outcome}</dd></div></dl>
          {item.missingInputs.length > 0 && <p className="skill-preparation-note">Before your first task: {item.missingInputs.join(' ')}</p>}
          <div className="skill-download-actions">{artifact ? <a className="button button-primary" href={artifact.url} download={artifact.filename}><ArrowDownToLine size={16} />Download skill <span className="skill-file-size">ZIP · {Math.max(1, Math.round(artifact.bytes / 1024))} KB</span></a> : <p role="alert">This download is unavailable. Please try again after reloading.</p>}<a className="compass-text-button" href={`/prompts/${item.skill.relatedPromptSlug}?from=skills`} onClick={(event) => navigate(`/prompts/${item.skill.relatedPromptSlug}?from=skills`, event)}>Try a related prompt <ArrowUpRight size={14} /></a></div>
          <details className="skill-guide"><summary>How to install & try this skill <ArrowRight size={15} /></summary><div className="skill-guide-content">
            <InstallationGuide platform={platform} skill={item.skill} />
            <div className="skill-sample"><h4>Try it with sample material</h4><p>Use this after installation, or try the task directly in a chat.</p><pre>{sample}</pre><button className="button button-outline" onClick={() => onCopy(sample, key)}>{copied === key ? <CheckCheck size={15} /> : <Copy size={15} />}{copied === key ? 'Copied' : 'Copy sample task'}</button></div>
            <div className="skill-package-contents"><h4>Inside your download</h4><ul>{item.skill.sourceFiles.map((file) => <li key={file}><FileText size={13} />{file}</li>)}</ul><p>A reusable set of instructions, a task-specific output template, and a worked example. Your survey answers are not included.</p>{artifact && <details><summary>File verification</summary><p>SHA-256</p><code>{artifact.sha256}</code></details>}</div>
          </div></details>
        </article>;
      })}</div>
      <details className="compass-more-skills"><summary>Explore the other skills <ArrowRight size={16} /></summary><p>Your working style does not limit what you can try.</p><div>{remaining.map((skill) => {
        const artifact = downloads.find((item) => item.id === skill.id && item.version === skill.version);
        return <article key={skill.id}><h3>{skill.title}</h3><p>{skill.summary}</p><p className="compass-fine-print">Prepare: {skill.inputs.join('; ')}</p>{artifact && <a className="compass-text-button" href={artifact.url} download={artifact.filename}>Download ZIP <ArrowDownToLine size={14} /></a>}<details className="skill-other-guide"><summary>Installation & sample task</summary><InstallationGuide platform={platform} skill={skill} /><pre>{skill.starterPrompt}\n\n{skill.sampleInput}</pre><button className="button button-outline" onClick={() => onCopy(`${skill.starterPrompt}\n\n${skill.sampleInput}`, `skill/${skill.id}`)}><Copy size={14} />{copied === `skill/${skill.id}` ? 'Copied' : 'Copy sample task'}</button></details></article>;
      })}</div></details>
      <div className="compass-result-footer"><a className="compass-text-button" href="/discover/review" onClick={(event) => navigate('/discover/review', event)}><ArrowLeft size={15} />Edit my answers</a><button className="compass-text-button" onClick={restart}><RotateCcw size={14} />Start again</button><span>Answers stay here until you refresh or start again.</span></div>
    </section>;
  }

  return <section className="compass-landing">
    <div className="compass-landing-main"><div className="eyebrow"><Compass size={16} /> FELLOW SKILL COMPASS</div><h1 ref={heading} tabIndex={-1}>Find your style.<br /><span>Take a skill with you.</span></h1><p>Tell us about your work. We’ll help you choose a reusable AI skill you can download and make your own.</p><div className="compass-landing-actions"><a className="button button-primary" href={progress.answered ? resumeHref : '/discover/1'} onClick={(event) => navigate(progress.answered ? resumeHref : '/discover/1', event)}>{progress.answered ? 'Continue your survey' : 'Find my skills'} <ArrowRight size={16} /></a><span>{questions.length} questions · No sign-in</span></div><p className="compass-fine-print">Your answers stay in this tab. Refreshing starts over.</p></div>
    <div className="compass-map" aria-label="Six working styles"><div className="compass-map-center" aria-hidden="true"><Compass size={95} strokeWidth={.9} /><span>A LITTLE<br />DIRECTION</span></div>{styles.map((style, index) => <span className={`compass-map-label position-${index}`} key={style.id}>{style.name}</span>)}</div>
    <div className="compass-how"><div><span>01</span><h2>A short conversation</h2><p>Your goals, your habits, and the work you want to make easier.</p></div><div><span>02</span><h2>A useful starting point</h2><p>A working style and three skills, with a reason for each recommendation.</p></div><div><span>03</span><h2>Something to keep</h2><p>Download a skill with instructions, an output template, and a worked example.</p></div></div>
    <p className="compass-landing-note">Skills are reusable instructions for AI tools. Setup guides cover ChatGPT / Codex and Claude; you can also try a sample task in a chat.</p>
  </section>;
}
