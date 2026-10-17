import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, Check, Clock, Code2, Cloud, Database, Layers, Loader2, Search, Sparkles, Target } from 'lucide-react';
import { api } from '../lib/api';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';

interface Template {
  key: string;
  title: string;
  description: string;
  milestoneCount: number;
}

const skillLevels = [
  { value: 'beginner', label: 'Beginner', description: 'I’m building my foundations' },
  { value: 'intermediate', label: 'Intermediate', description: 'I know the basics and want to grow' },
  { value: 'advanced', label: 'Advanced', description: 'I’m sharpening professional skills' }
];

const icons = { frontend: Code2, backend: Database, fullstack: Layers, devops: Cloud, datascience: BarChart3 } as const;

export default function RoadmapBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get('template') || '');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [userGoals, setUserGoals] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [templateLoadAttempt, setTemplateLoadAttempt] = useState(0);
  const hasUnsavedChanges = Boolean(userGoals.trim() || skillLevel !== 'beginner' || selectedTemplate !== (searchParams.get('template') || ''));
  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    let active = true;
    setFetching(true);
    setError('');
    api<{ templates: Template[] }>('/roadmaps/templates')
      .then((data) => { if (active) setTemplates(data.templates || []); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Failed to load learning paths'); })
      .finally(() => { if (active) setFetching(false); });
    return () => { active = false; };
  }, [templateLoadAttempt]);

  const selected = templates.find((template) => template.key === selectedTemplate);
  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? templates.filter((template) => `${template.title} ${template.description}`.toLowerCase().includes(normalized)) : templates;
  }, [query, templates]);

  const handleGenerate = async () => {
    if (!selectedTemplate) { setError('Choose a career path to continue'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await api<{ roadmap: { id: string } }>('/roadmaps/generate', {
        method: 'POST',
        body: { roleType: selectedTemplate, skillLevel, userGoals: userGoals.trim() || `Learn ${selected?.title || selectedTemplate}` }
      });
      navigate(`/roadmaps/${data.roadmap.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create your learning path');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10">
      <button type="button" onClick={() => {
        if (!hasUnsavedChanges || window.confirm('Leave this page? Your roadmap setup has not been saved.')) navigate('/roadmaps');
      }} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"><ArrowLeft className="size-4" /> All learning paths</button>

      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> Build your next step</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-card-foreground sm:text-4xl">Create a learning roadmap</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Choose a path, set your starting level, and add your goals. We’ll shape the stages around your experience and include free docs, YouTube videos, courses, and practice links.</p>
      </header>

      {error && <div role="alert" aria-live="assertive" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><span>{error}</span>{templates.length === 0 && !fetching && <button type="button" onClick={() => setTemplateLoadAttempt((attempt) => attempt + 1)} className="ml-3 font-semibold underline underline-offset-2">Try again</button>}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Step 1</p><h2 className="mt-1 text-xl font-bold text-card-foreground">Choose a career path</h2></div>
              <span className="text-xs text-muted-foreground">{templates.length} paths</span>
            </div>
            <label className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
              <Search className="size-4 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search paths…" className="w-full bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground" />
            </label>
            {fetching ? <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" /> Loading learning paths…</div> : filteredTemplates.length ? (
              <div className="grid gap-3 sm:grid-cols-2" aria-label="Available learning paths">
                {filteredTemplates.map((template) => {
                  const Icon = icons[template.key as keyof typeof icons] || Target;
                  const active = selectedTemplate === template.key;
                  return <button key={template.key} onClick={() => { setSelectedTemplate(template.key); setError(''); }} aria-pressed={active} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/15' : 'border-border bg-background hover:border-primary/40'}`}>
                    <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>{active && <Check className="size-5 text-primary" />}</div>
                    <h3 className="mt-4 font-semibold text-card-foreground">{template.title}</h3>
                    <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{template.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Target className="size-3.5" /> {template.milestoneCount} stages</span>
                  </button>;
                })}
              </div>
            ) : <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No paths match “{query}”. Try another search.</p>}
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Step 2</p><h2 className="mt-1 text-xl font-bold text-card-foreground">Set your starting point</h2></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {skillLevels.map((level) => <button key={level.value} type="button" onClick={() => setSkillLevel(level.value)} aria-pressed={skillLevel === level.value} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${skillLevel === level.value ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/15' : 'border-border hover:border-primary/40'}`}>
                <span className="text-sm font-semibold text-card-foreground">{level.label}</span><p className="mt-1 text-xs leading-5 text-muted-foreground">{level.description}</p>
              </button>)}
            </div>
            <label className="mt-6 block"><span className="text-sm font-semibold text-card-foreground">Your goals <span className="font-normal text-muted-foreground">(optional)</span></span>
              <textarea value={userGoals} onChange={(event) => setUserGoals(event.target.value)} placeholder="What would you like to build or focus on? For example: learn React and create accessible, mobile-first apps." rows={4} className="mt-2 w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Your path preview</p>
            {selected ? <><h2 className="mt-3 text-xl font-bold text-card-foreground">{selected.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.description}</p><div className="mt-5 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Target className="size-4 text-primary" /> {selected.milestoneCount} guided stages</p><p className="flex items-center gap-2 capitalize"><BarChart3 className="size-4 text-primary" /> {skillLevel} starting level</p><p className="flex items-center gap-2"><Clock className="size-4 text-primary" /> Learn at your own pace</p></div></> : <p className="mt-3 text-sm text-muted-foreground">Select a path to see its details here.</p>}
            <button onClick={handleGenerate} disabled={!selected || loading || fetching} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><Loader2 className="size-4 animate-spin" /> Building your map…</> : <>Create roadmap <ArrowRight className="size-4" /></>}</button>
          </section>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-sm"><p className="font-semibold text-card-foreground">Free learning links included</p><p className="mt-1 leading-5 text-muted-foreground">Stages include official docs, free YouTube lessons, courses, and hands-on practice links.</p></div>
        </aside>
      </div>
    </div>
  );
}
