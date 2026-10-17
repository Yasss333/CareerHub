import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Share2, CheckCircle2, Circle, ChevronDown, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import ResourceCard from '../components/ResourceCard';

interface Milestone {
  id: string;
  title: string;
  description: string;
  order: number;
  isCompleted: boolean;
  topics: string[];
  resources?: any;
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
  resources?: any;
}

export default function RoadmapDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [generatingResources, setGeneratingResources] = useState(false);

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

  const toggleMilestone = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };

  const toggleComplete = async (milestoneId: string) => {
    try {
      await api(`/roadmaps/${id}/milestones/${milestoneId}/complete`, {
        method: 'PUT'
      });
      fetchRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update milestone');
    }
  };

  const handleGenerateResources = async (topic: string) => {
    setGeneratingResources(true);
    try {
      await api(`/roadmaps/${id}/resources`, {
        method: 'POST',
        body: JSON.stringify({ topic })
      });
      fetchRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resources');
    } finally {
      setGeneratingResources(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this roadmap?')) return;

    try {
      await api(`/roadmaps/${id}`, { method: 'DELETE' });
      navigate('/roadmaps');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete roadmap');
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Roadmap not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/roadmaps')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{roadmap.title}</h1>
            <p className="text-gray-600 mt-1 capitalize">{roadmap.roleType} • {roadmap.skillLevel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete roadmap"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Overall Progress</h2>
          <span className="text-2xl font-bold text-blue-600">{Math.round(roadmap.progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${roadmap.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>{roadmap.milestones.filter(m => m.isCompleted).length} of {roadmap.milestones.length} milestones completed</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">{roadmap.status}</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {roadmap.milestones.map((milestone, index) => (
          <div key={milestone.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleMilestone(milestone.id)}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(milestone.id);
                  }}
                  className="flex-shrink-0 mt-1"
                >
                  {milestone.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                    {expandedMilestones.has(milestone.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  )}
                </div>
              </div>
            </div>

            {expandedMilestones.has(milestone.id) && (
              <div className="border-t border-gray-200 p-5 bg-gray-50">
                {/* Topics */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Topics to Learn</h4>
                  <ul className="space-y-1">
                    {milestone.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Learning Resources</h4>
                    <button
                      onClick={() => handleGenerateResources(milestone.title)}
                      disabled={generatingResources}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </button>
                  </div>
                  {!milestone.resources || Object.keys(milestone.resources).length === 0 ? (
                    <p className="text-sm text-gray-500">No resources yet. Click "Generate with AI" to get free learning resources.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {milestone.resources.articles?.map((resource: any, idx: number) => (
                        <ResourceCard key={idx} resource={resource} type="article" />
                      ))}
                      {milestone.resources.videos?.map((resource: any, idx: number) => (
                        <ResourceCard key={idx} resource={resource} type="video" />
                      ))}
                      {milestone.resources.practice?.map((resource: any, idx: number) => (
                        <ResourceCard key={idx} resource={resource} type="practice" />
                      ))}
                      {milestone.resources.courses?.map((resource: any, idx: number) => (
                        <ResourceCard key={idx} resource={resource} type="course" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
