import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  Layers,
  Loader2,
  Map,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2
} from 'lucide-react';
import { api } from '../lib/api';

interface Roadmap {
  id: string;
  title: string;
  description: string;
  roleType: string;
  skillLevel: string;
  status: string;
  progress: number;
  createdAt: string;
  milestones: Array<{ id: string; title: string; order: number; isCompleted: boolean }>;
}

interface Template {
  key: string;
  title: string;
  description: string;
  milestoneCount: number;
}

const roleIcons = {
  frontend: Code2,
  backend: Database,
  fullstack: Layers,
  devops: Cloud,
  datascience: BarChart3
} as const;

const roleColors = {
  frontend: 'from-primary/15 to-primary/5 text-primary',
  backend: 'from-primary/15 to-primary/5 text-primary',
  fullstack: 'from-primary/15 to-primary/5 text-primary',
  devops: 'from-primary/15 to-primary/5 text-primary',
  datascience: 'from-primary/15 to-primary/5 text-primary'
} as const;

export default function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ roadmaps: Roadmap[] }>('/roadmaps'),
      api<{ templates: Template[] }>('/roadmaps/templates')
    ]).then(([roadmapData, templateData]) => {
      if (!active) return;
      setRoadmaps(roadmapData.roadmaps || []);
      setTemplates(templateData.templates || []);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Could not load learning paths');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return templates;
    return templates.filter((template) => `${template.title} ${template.description}`.toLowerCase().includes(normalizedQuery));
  }, [query, templates]);

  const totalMilestones = roadmaps.reduce((count, roadmap) => count + roadmap.milestones.length, 0);
  const completedMilestones = roadmaps.reduce((count, roadmap) => count + roadmap.milestones.filter((milestone) => milestone.isCompleted).length, 0);

  const handleDelete = async (roadmapId: string) => {
    if (!confirm('Delete this learning roadmap? This cannot be undone.')) return;
    try {
      await api(`/roadmaps/${roadmapId}`, { method: 'DELETE' });
      setRoadmaps((current) => current.filter((roadmap) => roadmap.id !== roadmapId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete roadmap');
    }
  };

  if (loading) {
    return <div className="flex min-h-80 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-9 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-9">
        <div className="pointer-events-none absolute -right-14 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Map className="size-3.5" /> CareerHub learning paths</span>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-card-foreground sm:text-5xl">Know what to learn next.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Explore practical paths, follow a visual map, and open free documentation, courses, and practice as you go.</p>
            <Link to="/roadmaps/builder" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
              <Plus className="size-4" /> Build a learning path <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-background/80 p-4">
            <div className="px-2 text-center">
              <p className="text-2xl font-bold text-card-foreground">{roadmaps.length}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">Paths</p>
            </div>
            <div className="px-2 text-center">
              <p className="text-2xl font-bold text-card-foreground">{completedMilestones}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">Stages done</p>
            </div>
            <div className="px-2 text-center">
              <p className="text-2xl font-bold text-card-foreground">{Math.max(0, totalMilestones - completedMilestones)}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">To explore</p>
            </div>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>}

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pick up where you left off</p>
            <h2 className="mt-1 text-2xl font-bold text-card-foreground">Your learning paths</h2>
          </div>
          {roadmaps.length > 0 && <span className="text-sm text-muted-foreground">{roadmaps.length} saved {roadmaps.length === 1 ? 'path' : 'paths'}</span>}
        </div>

        {roadmaps.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="size-6" /></div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground">Your first path starts here</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a role below, set your level, and get a visual path with free resources attached to each stage.</p>
            </div>
            <Link to="/roadmaps/builder" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-card-foreground transition hover:border-primary/40 hover:text-primary">Choose a path <ChevronRight className="size-4" /></Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roadmaps.map((roadmap) => {
              const Icon = roleIcons[roadmap.roleType.toLowerCase() as keyof typeof roleIcons] || Map;
              const remaining = roadmap.milestones.length - roadmap.milestones.filter((milestone) => milestone.isCompleted).length;
              return (
                <article key={roadmap.id} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${roleColors[roadmap.roleType.toLowerCase() as keyof typeof roleColors] || 'from-primary/15 to-primary/5 text-primary'}`}><Icon className="size-5" /></div>
                    <button onClick={() => handleDelete(roadmap.id)} aria-label={`Delete ${roadmap.title}`} className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600"><Trash2 className="size-4" /></button>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-card-foreground">{roadmap.title}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{roadmap.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{roadmap.skillLevel}</span>
                    <span>{roadmap.milestones.length} stages</span>
                    <span>·</span>
                    <span>{remaining} left</span>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-semibold text-card-foreground">{Math.round(roadmap.progress)}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, roadmap.progress))}%` }} /></div>
                  </div>
                  <Link to={`/roadmaps/${roadmap.id}`} className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold text-card-foreground transition group-hover:border-primary/30 group-hover:text-primary">
                    Continue path <ArrowUpRight className="size-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Explore by role</p>
            <h2 className="mt-1 text-2xl font-bold text-card-foreground">Start with a proven path</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every path includes a stage-by-stage map and free learning links.</p>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learning paths" className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" />
          </label>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No paths match “{query}”. Try another role or skill.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => {
              const Icon = roleIcons[template.key.toLowerCase() as keyof typeof roleIcons] || Target;
              const color = roleColors[template.key.toLowerCase() as keyof typeof roleColors] || 'from-primary/15 to-primary/5 text-primary';
              return (
                <Link key={template.key} to={`/roadmaps/builder?template=${template.key}`} className="group rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color}`}><Icon className="size-5" /></div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-card-foreground">{template.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{template.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Map className="size-3.5 text-primary" /> {template.milestoneCount} stages</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Free resources</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-primary/[0.04] px-4 py-4 text-sm text-muted-foreground sm:px-5">
        <Sparkles className="size-5 shrink-0 text-primary" />
        <p>Follow a flexible sequence: mark stages complete as you learn, jump around whenever you need, and open free references without losing your place.</p>
      </div>
    </div>
  );
}
