import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ExternalLink,
  Loader2,
  Map,
  Sparkles,
  Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import ResourceCard from '../components/ResourceCard';

type Resource = {
  title: string;
  url: string;
  source?: string;
  description: string;
  duration?: string;
  platform?: string;
  free?: boolean;
  aiSuggested?: boolean;
};

type ResourceCollection = {
  articles?: Resource[];
  videos?: Resource[];
  practice?: Resource[];
  courses?: Resource[];
} | Resource[];

interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  isCompleted: boolean;
  topics: string[];
  resources?: ResourceCollection;
  dueDate?: string;
  completedAt?: string;
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  roleType: string;
  skillLevel: string;
  status: string;
  progress: number;
  isPublic: boolean;
  createdAt: string;
  milestones: Milestone[];
}

const resourceTypes = [
  { key: 'articles', label: 'Docs & guides', type: 'article' as const },
  { key: 'courses', label: 'Free courses', type: 'course' as const },
  { key: 'practice', label: 'Practice', type: 'practice' as const },
  { key: 'videos', label: 'Videos', type: 'video' as const }
];

function resourcesFor(milestone: Milestone, key: string): Resource[] {
  if (Array.isArray(milestone.resources)) {
    return key === 'articles' ? milestone.resources : [];
  }

  const groups = milestone.resources as Record<string, unknown> | undefined;
  const resources = groups?.[key];
  return Array.isArray(resources) ? resources : [];
}

function countResources(milestone: Milestone) {
  return resourceTypes.reduce((count, group) => count + resourcesFor(milestone, group.key).length, 0);
}

const titleCase = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function RoadmapDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [busyMilestoneId, setBusyMilestoneId] = useState('');

  const fetchRoadmap = async () => {
    try {
      const data = await api<{ roadmap: Roadmap }>(`/roadmaps/${id}`);
      setRoadmap(data.roadmap);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRoadmap();
  }, [id]);

  useEffect(() => {
    if (!roadmap?.milestones.length) return;
    setSelectedMilestoneId((current) => roadmap.milestones.some((milestone) => milestone.id === current)
      ? current
      : (roadmap.milestones.find((milestone) => !milestone.isCompleted) || roadmap.milestones[0]).id);
  }, [roadmap]);

  const selectedMilestone = useMemo(
    () => roadmap?.milestones.find((milestone) => milestone.id === selectedMilestoneId) || null,
    [roadmap, selectedMilestoneId]
  );

  const toggleComplete = async (milestone: Milestone) => {
    setBusyMilestoneId(milestone.id);
    setError('');
    try {
      await api(`/roadmaps/${id}/milestones/${milestone.id}/complete`, { method: 'PUT' });
      await fetchRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this stage');
    } finally {
      setBusyMilestoneId('');
    }
  };

  const handleGenerateResources = async (milestone: Milestone) => {
    setBusyMilestoneId(milestone.id);
    setError('');
    try {
      const data = await api<{ resources: ResourceCollection }>(`/roadmaps/${id}/resources`, {
        method: 'POST',
        body: { topic: milestone.title, milestoneId: milestone.id }
      });
      setRoadmap((current) => current ? {
        ...current,
        milestones: current.milestones.map((item) => item.id === milestone.id
          ? { ...item, resources: data.resources }
          : item)
      } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find more learning links');
    } finally {
      setBusyMilestoneId('');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this learning roadmap? This cannot be undone.')) return;
    try {
      await api(`/roadmaps/${id}`, { method: 'DELETE' });
      navigate('/roadmaps');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete roadmap');
    }
  };

  const advanceToNext = () => {
    if (!roadmap || !selectedMilestone) return;
    const nextMilestone = roadmap.milestones.find((milestone) => milestone.order > selectedMilestone.order && !milestone.isCompleted)
      || roadmap.milestones.find((milestone) => milestone.order > selectedMilestone.order);
    if (nextMilestone) setSelectedMilestoneId(nextMilestone.id);
  };

  if (loading) {
    return <div role="status" aria-live="polite" className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground"><Loader2 className="size-6 animate-spin text-primary" /> Loading your roadmap…</div>;
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-12 text-center">
        <Map className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-card-foreground">Roadmap not found</h1>
        {error ? <p role="alert" aria-live="assertive" className="mt-2 text-sm text-destructive">{error}</p> : <p className="mt-2 text-sm text-muted-foreground">This path may have been deleted or is no longer available.</p>}
        {error && <button type="button" onClick={() => { setLoading(true); fetchRoadmap(); }} className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-muted">Try again</button>}
        <Link to="/roadmaps" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" /> Back to roadmaps</Link>
      </div>
    );
  }

  const milestones = [...roadmap.milestones].sort((a, b) => a.order - b.order);
  const completedCount = milestones.filter((milestone) => milestone.isCompleted).length;
  const totalResources = milestones.reduce((count, milestone) => count + countResources(milestone), 0);
  const selectedTopics = Array.isArray(selectedMilestone?.topics) ? selectedMilestone.topics : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/roadmaps" className="inline-flex items-center gap-2 transition hover:text-primary"><ArrowLeft className="size-4" /> Learning paths</Link>
          <ChevronRight className="size-4" />
          <span className="max-w-56 truncate text-card-foreground">{roadmap.title}</span>
        </div>
        <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-red-300 hover:text-red-600">
          <Trash2 className="size-4" /> Delete path
        </button>
      </div>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>}

      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Map className="size-3.5" /> {titleCase(roadmap.roleType)} path</span>
              <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground">{roadmap.skillLevel} level</span>
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-card-foreground sm:text-4xl">{roadmap.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{roadmap.description || 'A structured learning path built around the skills you need next.'}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your progress</p>
                <p className="mt-2 text-3xl font-bold text-card-foreground">{Math.round(roadmap.progress)}<span className="text-lg text-muted-foreground">%</span></p>
              </div>
              <span className="pb-1 text-sm text-muted-foreground">{completedCount} / {milestones.length} stages</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, roadmap.progress))}%` }} />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><BookOpen className="size-3.5 text-primary" /> {totalResources} learning links ready to explore</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Learning map</p>
              <h2 className="mt-1 text-xl font-bold text-card-foreground">Follow the path, one stage at a time</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-500" /> Complete</span>
              <span className="inline-flex items-center gap-1.5"><Circle className="size-4" /> Up next</span>
            </div>
          </div>

          {milestones.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">This roadmap does not have any stages yet.</div>
          ) : (
            <div className="relative space-y-4 px-4 py-6 before:absolute before:bottom-8 before:left-[39px] before:top-8 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent sm:px-6 sm:before:left-[51px]">
              {milestones.map((milestone, index) => {
                const isSelected = milestone.id === selectedMilestoneId;
                const topics = Array.isArray(milestone.topics) ? milestone.topics : [];
                const resourceCount = countResources(milestone);

                return (
                  <div key={milestone.id} className="relative flex gap-3 sm:gap-5">
                    <button
                      onClick={() => setSelectedMilestoneId(milestone.id)}
                      aria-label={`Select stage ${index + 1}: ${milestone.title}`}
                      aria-pressed={isSelected}
                      className={`relative z-10 mt-4 flex size-11 shrink-0 items-center justify-center rounded-2xl border-4 border-card text-sm font-bold shadow-sm transition sm:size-12 ${
                        milestone.isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isSelected
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                            : 'bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary'
                      }`}
                    >
                      {milestone.isCompleted ? <Check className="size-5" /> : String(index + 1).padStart(2, '0')}
                    </button>

                    <button
                      onClick={() => setSelectedMilestoneId(milestone.id)}
                      className={`min-w-0 flex-1 rounded-2xl border p-4 text-left transition sm:p-5 ${
                        isSelected ? 'border-primary/50 bg-primary/[0.035] shadow-md shadow-primary/5' : 'border-border bg-background hover:border-primary/30 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Stage {String(index + 1).padStart(2, '0')}</p>
                          <h3 className="mt-1 text-base font-semibold text-card-foreground sm:text-lg">{milestone.title}</h3>
                          {milestone.description && <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{milestone.description}</p>}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${milestone.isCompleted ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                          {milestone.isCompleted ? 'Completed' : 'In your path'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {topics.slice(0, 4).map((topic, topicIndex) => (
                          <span key={`${milestone.id}-${topicIndex}`} className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">{topic}</span>
                        ))}
                        {topics.length > 4 && <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">+{topics.length - 4} topics</span>}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                        <span>{topics.length} topics to learn</span>
                        <span className="inline-flex items-center gap-1.5"><BookOpen className="size-3.5 text-primary" /> {resourceCount} learning links <ChevronRight className="size-3.5" /></span>
                      </div>
                    </button>

                    <button
                      onClick={() => toggleComplete(milestone)}
                      disabled={busyMilestoneId === milestone.id}
                      aria-label={milestone.isCompleted ? `Mark ${milestone.title} incomplete` : `Mark ${milestone.title} complete`}
                      title={milestone.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      className="mt-4 hidden size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50 sm:flex"
                    >
                      {busyMilestoneId === milestone.id ? <Loader2 className="size-4 animate-spin" /> : milestone.isCompleted ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-6">
          {selectedMilestone ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
              <div className="bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">Stage {String(milestones.findIndex((milestone) => milestone.id === selectedMilestone.id) + 1).padStart(2, '0')}</p>
                    <h2 className="mt-2 text-xl font-bold leading-snug text-card-foreground">{selectedMilestone.title}</h2>
                  </div>
                  <button
                    onClick={() => toggleComplete(selectedMilestone)}
                    disabled={busyMilestoneId === selectedMilestone.id}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${selectedMilestone.isCompleted ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                  >
                    {busyMilestoneId === selectedMilestone.id ? <Loader2 className="size-3.5 animate-spin" /> : selectedMilestone.isCompleted ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
                    {selectedMilestone.isCompleted ? 'Done' : 'Mark done'}
                  </button>
                </div>
                {selectedMilestone.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedMilestone.description}</p>}
                <button onClick={advanceToNext} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary transition hover:gap-3">
                  Jump to next stage <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">What you’ll learn</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{selectedTopics.length} topics in this stage</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Stage {selectedMilestone.order}</span>
                  </div>
                  <ul className="space-y-2">
                    {selectedTopics.map((topic, index) => (
                      <li key={`${selectedMilestone.id}-detail-${index}`} className="flex gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border pt-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">Free learning resources</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Curated documentation, courses, and practice.</p>
                    </div>
                    <button
                      onClick={() => handleGenerateResources(selectedMilestone)}
                      disabled={busyMilestoneId === selectedMilestone.id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
                    >
                      {busyMilestoneId === selectedMilestone.id ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      More links
                    </button>
                  </div>

                  <div className="space-y-5">
                    {resourceTypes.map((group) => {
                      const resources = resourcesFor(selectedMilestone, group.key);
                      if (!resources.length) return null;
                      return (
                        <div key={group.key}>
                          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{group.label}</h3>
                          <div className="space-y-2.5">
                            {resources.map((resource, index) => <ResourceCard key={`${resource.url}-${index}`} resource={resource} type={group.type} />)}
                          </div>
                        </div>
                      );
                    })}
                    {countResources(selectedMilestone) === 0 && (
                      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                        <p>No links are attached to this stage yet.</p>
                        <button onClick={() => handleGenerateResources(selectedMilestone)} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary"><ExternalLink className="size-3.5" /> Find free links</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-7 text-center text-sm text-muted-foreground">Select a stage to view its topics and free resources.</div>
          )}
        </aside>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm">
        <Link to="/roadmaps" className="inline-flex items-center gap-2 font-medium text-muted-foreground transition hover:text-primary"><ArrowLeft className="size-4" /> All learning paths</Link>
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex"><ExternalLink className="size-3.5" /> Links open in a new tab</span>
      </div>
    </div>
  );
}
