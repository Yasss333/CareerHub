import { ExternalLink, BookOpen, Video, Code, GraduationCap } from 'lucide-react';

interface Resource {
  title: string;
  url: string;
  source?: string;
  description: string;
  duration?: string;
  platform?: string;
  free?: boolean;
  aiSuggested?: boolean;
}

interface ResourceCardProps {
  resource: Resource;
  type: 'article' | 'video' | 'practice' | 'course';
}

const resourceIcons = {
  article: BookOpen,
  video: Video,
  practice: Code,
  course: GraduationCap
};

export default function ResourceCard({ resource, type }: ResourceCardProps) {
  const Icon = resourceIcons[type];

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-semibold text-card-foreground">
              {resource.title}
            </h4>
            {resource.free && (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Free
              </span>
            )}
            {resource.aiSuggested && (
              <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                AI suggestion
              </span>
            )}
          </div>
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {resource.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {resource.source && (
              <span className="rounded-full bg-muted px-2 py-1 font-medium">
                {resource.source}
              </span>
            )}
            {resource.duration && (
              <span>{resource.duration}</span>
            )}
            {resource.platform && (
              <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">
                {resource.platform}
              </span>
            )}
          </div>
        </div>
        <ExternalLink aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </div>
    </a>
  );
}
