import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit3, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

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
  milestones: Array<{
    id: string;
    title: string;
    order: number;
    isCompleted: boolean;
  }>;
}

export default function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoadmaps = async () => {
    try {
      const data = await api<{ roadmaps: Roadmap[] }>('/roadmaps');
      setRoadmaps(data.roadmaps);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap?')) return;

    try {
      await api(`/roadmaps/${id}`, { method: 'DELETE' });
      fetchRoadmaps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete roadmap');
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Roadmaps</h1>
          <p className="text-gray-600 mt-2">Track your learning journey with personalized career paths</p>
        </div>
        <Link
          to="/roadmaps/builder"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Roadmap
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {roadmaps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No roadmaps yet</h3>
          <p className="text-gray-600 mb-4">Create your first learning roadmap to track your progress</p>
          <Link
            to="/roadmaps/builder"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Roadmap
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <div key={roadmap.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{roadmap.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{roadmap.roleType} • {roadmap.skillLevel}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(roadmap.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete roadmap"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{Math.round(roadmap.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${roadmap.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-gray-100">
                    {roadmap.status}
                  </span>
                  <span>•</span>
                  <span>{roadmap.milestones.length} milestones</span>
                </div>

                <Link
                  to={`/roadmaps/${roadmap.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Roadmap
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
