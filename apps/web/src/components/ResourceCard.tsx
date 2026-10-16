import { useState } from 'react';
import { ExternalLink, BookOpen, Video, Code, GraduationCap } from 'lucide-react';

interface Resource {
  title: string;
  url: string;
  source?: string;
  description: string;
  duration?: string;
  platform?: string;
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
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
            {resource.title}
          </h4>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {resource.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {resource.source && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                {resource.source}
              </span>
            )}
            {resource.duration && (
              <span>{resource.duration}</span>
            )}
            {resource.platform && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                {resource.platform}
              </span>
            )}
          </div>
        </div>
        <ExternalLink className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
      </div>
    </a>
  );
}
