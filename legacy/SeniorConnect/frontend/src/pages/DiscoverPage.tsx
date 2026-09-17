import { useApp } from '@/store';
import { useEffect, useState } from 'react';
import { seniorsApi } from '@/api';
import type { ApiSenior } from '@/api';
import { EmptyState } from '@/components/ui';
import { Search, Users } from 'lucide-react';

export function DiscoverPage() {
  const { navigate, selectedSeniorId, selectSenior } = useApp();
  const [seniors, setSeniors] = useState<ApiSenior[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setLoading(true);
    seniorsApi.list({ search, role }).then(setSeniors).finally(() => setLoading(false));
  }, [search, role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-secondary-900">Discover Mentors</h1>
        <p className="mt-2 text-secondary-500">Find and connect with experienced professionals</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
          <option value="">All Roles</option>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="Data">Data</option>
          <option value="DevOps">DevOps</option>
          <option value="Management">Management</option>
        </select>
      </div>

      {loading ? (
        <EmptyState icon={<Users />} title="Loading" description="Fetching mentors..." />
      ) : seniors.length === 0 ? (
        <EmptyState icon={<Users />} title="No mentors found" description="Try adjusting your filters" />
      ) : (
        <div className="grid gap-4">
          {seniors.map((senior) => (
            <button
              key={senior.id}
              onClick={() => selectSenior(senior.id)}
              className="flex items-start gap-4 p-4 bg-white rounded-xl border border-secondary-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left"
            >
              <img src={senior.avatar} alt="" className="h-16 w-16 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900">{senior.name}</p>
                <p className="text-sm text-secondary-500">{senior.title} at {senior.company}</p>
                <p className="mt-1 text-xs text-secondary-400 line-clamp-2">{senior.bio}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {senior.expertise.slice(0, 3).map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-secondary-900">{senior.rating}/5</p>
                <p className="text-xs text-secondary-500">{senior.reviewCount} reviews</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
