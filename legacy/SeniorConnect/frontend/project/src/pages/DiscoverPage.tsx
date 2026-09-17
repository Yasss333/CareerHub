import { useState, useMemo } from 'react';
import { seniors, filterOptions } from '@/mockData';
import { SeniorCard } from '@/components/SeniorCard';
import { EmptyState } from '@/components/ui';
import type { Senior } from '@/types';
import { Search, SlidersHorizontal, X, ChevronDown, Star, Award, Users } from 'lucide-react';

type SortOption = 'credibility' | 'rating' | 'sessions' | 'experience';

export function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [minCredibility, setMinCredibility] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('credibility');
  const [showFilters, setShowFilters] = useState(false);

  const toggleArray = (value: string, arr: string[], setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const filtered = useMemo(() => {
    let result: Senior[] = seniors.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.title.toLowerCase().includes(q) &&
          !s.company.toLowerCase().includes(q) &&
          !s.expertise.some((e) => e.toLowerCase().includes(q)) &&
          !s.domain.toLowerCase().includes(q)
        )
          return false;
      }
      if (selectedRoles.length && !selectedRoles.includes(s.role)) return false;
      if (selectedCompanies.length && !selectedCompanies.includes(s.company)) return false;
      if (selectedDomains.length && !selectedDomains.includes(s.domain)) return false;
      if (selectedExpertise.length && !selectedExpertise.some((e) => s.expertise.includes(e))) return false;
      if (selectedAvailability.length && !selectedAvailability.includes(s.availability)) return false;
      if (s.credibilityScore < minCredibility) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'credibility': return b.credibilityScore - a.credibilityScore;
        case 'rating': return b.rating - a.rating;
        case 'sessions': return b.sessionCount - a.sessionCount;
        case 'experience': return b.experience - a.experience;
      }
    });

    return result;
  }, [search, selectedRoles, selectedCompanies, selectedDomains, selectedExpertise, selectedAvailability, minCredibility, sortBy]);

  const activeFilterCount =
    selectedRoles.length + selectedCompanies.length + selectedDomains.length +
    selectedExpertise.length + selectedAvailability.length + (minCredibility > 0 ? 1 : 0);

  const clearAll = () => {
    setSelectedRoles([]);
    setSelectedCompanies([]);
    setSelectedDomains([]);
    setSelectedExpertise([]);
    setSelectedAvailability([]);
    setMinCredibility(0);
  };

  const FilterSection = ({ title, options, selected, onToggle }: {
    title: string;
    options: string[];
    selected: string[];
    onToggle: (v: string) => void;
  }) => (
    <div className="border-b border-secondary-100 py-4 last:border-0">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-secondary-400">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selected.includes(opt)
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Discover Senior Mentors</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Find the right mentor by role, company, domain, and expertise.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, skill, or domain..."
            className="input pl-11"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-secondary-400 hover:bg-secondary-100">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary relative lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`w-full flex-shrink-0 lg:w-72 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-secondary-500" />
                <h3 className="text-sm font-semibold text-secondary-700">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  Clear all
                </button>
              )}
            </div>

            <FilterSection title="Role" options={filterOptions.roles} selected={selectedRoles}
              onToggle={(v) => toggleArray(v, selectedRoles, setSelectedRoles)} />
            <FilterSection title="Company" options={filterOptions.companies} selected={selectedCompanies}
              onToggle={(v) => toggleArray(v, selectedCompanies, setSelectedCompanies)} />
            <FilterSection title="Domain" options={filterOptions.domains} selected={selectedDomains}
              onToggle={(v) => toggleArray(v, selectedDomains, setSelectedDomains)} />
            <FilterSection title="Expertise" options={filterOptions.expertise} selected={selectedExpertise}
              onToggle={(v) => toggleArray(v, selectedExpertise, setSelectedExpertise)} />
            <FilterSection title="Availability" options={[...filterOptions.availability]} selected={selectedAvailability}
              onToggle={(v) => toggleArray(v, selectedAvailability, setSelectedAvailability)} />

            {/* Credibility slider */}
            <div className="py-4">
              <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                Min credibility: {minCredibility}
              </h4>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minCredibility}
                onChange={(e) => setMinCredibility(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-secondary-400">
                <span>Any</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {/* Sort + count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-secondary-500">
              <span className="font-semibold text-secondary-700">{filtered.length}</span> mentor{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Search className="h-7 w-7" />}
                title="No mentors match your filters"
                description="Try removing some filters or adjusting your search."
                action={<button onClick={clearAll} className="btn-secondary">Clear filters</button>}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((senior) => (
                <SeniorCard key={senior.id} senior={senior} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
