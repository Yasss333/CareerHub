# Frontend Integration Guide - AlgoRank Seeded Problems

Quick reference for using the new seeded problems API in your React frontend.

## 🔗 API Endpoints Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/problems/get-all-problems` | GET | Get all problems |
| `/api/problems/filter` | GET | Filter by tags, difficulty, search |
| `/api/problems/tags` | GET | Get all available tags |
| `/api/problems/get-problem/:id` | GET | Get single problem details |

---

## 💻 Code Examples

### **1. Fetch All Available Tags**

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

function TagCloud() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('/api/problems/tags', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setTags(response.data.tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  if (loading) return <div>Loading tags...</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <button 
          key={tag.name}
          className="badge badge-lg gap-2"
        >
          {tag.name}
          <span className="text-xs">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}

export default TagCloud;
```

---

### **2. Filter Problems by Tag**

```jsx
function ProblemsFilter() {
  const [selectedTag, setSelectedTag] = useState(null);
  const [problems, setProblems] = useState([]);

  const filterByTag = async (tag) => {
    setSelectedTag(tag);
    try {
      const response = await axios.get('/api/problems/filter', {
        params: { tags: tag },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setProblems(response.data.problems);
    } catch (error) {
      console.error('Error filtering:', error);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['Amazon', 'Google', 'Microsoft', 'Meta', 'Apple'].map(company => (
          <button 
            key={company}
            onClick={() => filterByTag(company)}
            className={`btn btn-sm ${selectedTag === company ? 'btn-primary' : 'btn-outline'}`}
          >
            {company}
          </button>
        ))}
      </div>
      {/* Display problems */}
    </div>
  );
}
```

---

### **3. Filter by Difficulty**

```jsx
function DifficultyFilter() {
  const [difficulty, setDifficulty] = useState('');
  const [problems, setProblems] = useState([]);

  const filterByDifficulty = async (diff) => {
    setDifficulty(diff);
    try {
      const response = await axios.get('/api/problems/filter', {
        params: { difficulty: diff },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setProblems(response.data.problems);
    } catch (error) {
      console.error('Error filtering:', error);
    }
  };

  return (
    <div className="flex gap-2">
      {['EASY', 'MEDIUM', 'HARD'].map(level => (
        <button 
          key={level}
          onClick={() => filterByDifficulty(level)}
          className={`btn btn-sm ${
            difficulty === level 
              ? level === 'EASY' ? 'btn-success' : level === 'MEDIUM' ? 'btn-warning' : 'btn-error'
              : 'btn-outline'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
```

---

### **4. Advanced Filtering (Combined)**

```jsx
function AdvancedProblemFilter() {
  const [filters, setFilters] = useState({
    tags: [],
    difficulty: '',
    search: ''
  });
  const [problems, setProblems] = useState([]);

  const applyFilters = async () => {
    const params = {};
    
    if (filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }
    if (filters.difficulty) {
      params.difficulty = filters.difficulty;
    }
    if (filters.search) {
      params.search = filters.search;
    }

    try {
      const response = await axios.get('/api/problems/filter', {
        params,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setProblems(response.data.problems);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <input 
        type="text"
        placeholder="Search problems..."
        value={filters.search}
        onChange={(e) => {
          setFilters({...filters, search: e.target.value});
          applyFilters();
        }}
        className="input input-bordered w-full"
      />

      {/* Company Filter */}
      <div className="flex gap-2">
        {['Amazon', 'Google', 'Microsoft', 'Meta', 'Apple'].map(company => (
          <label key={company} className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={filters.tags.includes(company)}
              onChange={(e) => {
                const newTags = e.target.checked 
                  ? [...filters.tags, company]
                  : filters.tags.filter(t => t !== company);
                setFilters({...filters, tags: newTags});
              }}
            />
            {company}
          </label>
        ))}
      </div>

      {/* Difficulty Filter */}
      <select 
        value={filters.difficulty}
        onChange={(e) => {
          setFilters({...filters, difficulty: e.target.value});
          applyFilters();
        }}
        className="select select-bordered"
      >
        <option value="">All Difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      {/* Results */}
      <div className="text-sm text-gray-500">
        Found {problems.length} problems
      </div>
    </div>
  );
}
```

---

### **5. Search Problems**

```jsx
function ProblemSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/problems/filter', {
        params: { search: term },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setResults(response.data.problems);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input 
        type="text"
        placeholder="Search (e.g., 'two sum', 'array')..."
        value={searchTerm}
        onChange={handleSearch}
        className="input input-bordered w-full"
      />
      
      {loading && <div>Searching...</div>}
      
      {results.map(problem => (
        <div key={problem.id} className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">{problem.title}</h3>
            <div className="flex gap-2">
              <span className={`badge ${
                problem.difficulty === 'EASY' ? 'badge-success' :
                problem.difficulty === 'MEDIUM' ? 'badge-warning' :
                'badge-error'
              }`}>
                {problem.difficulty}
              </span>
              {problem.tags.map(tag => (
                <span key={tag} className="badge badge-outline">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### **6. Problem Card Component**

```jsx
function ProblemCard({ problem, onSolveClick }) {
  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body">
        <h3 className="card-title">{problem.title}</h3>
        
        <p className="text-sm text-gray-600">
          {problem.description?.substring(0, 100)}...
        </p>

        <div className="flex flex-wrap gap-2">
          <span className={`badge ${
            problem.difficulty === 'EASY' ? 'badge-success' :
            problem.difficulty === 'MEDIUM' ? 'badge-warning' :
            'badge-error'
          }`}>
            {problem.difficulty}
          </span>
          {problem.tags.map(tag => (
            <span key={tag} className="badge badge-outline badge-sm">
              {tag}
            </span>
          ))}
        </div>

        {problem.isSolved && (
          <div className="badge badge-success gap-2">
            ✓ Solved
          </div>
        )}

        <div className="card-actions justify-end">
          <button 
            onClick={() => onSolveClick(problem.id)}
            className="btn btn-primary btn-sm"
          >
            Solve
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### **7. Company-Specific Collections**

```jsx
function CompanyCollections() {
  const companies = [
    { name: 'Amazon', icon: '🟠', problems: 8 },
    { name: 'Google', icon: '🔵', problems: 3 },
    { name: 'Microsoft', icon: '🟢', problems: 2 },
    { name: 'Meta', icon: '🔵', problems: 2 },
    { name: 'Apple', icon: '⚫', problems: 3 }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {companies.map(company => (
        <div key={company.name} className="card bg-base-100 cursor-pointer hover:shadow-lg">
          <div className="card-body items-center text-center">
            <div className="text-4xl">{company.icon}</div>
            <h3 className="font-bold">{company.name}</h3>
            <p className="text-sm text-gray-500">{company.problems} problems</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Integration Tips

1. **Use Zustand Store** for caching problems
2. **Debounce search** to reduce API calls
3. **Implement pagination** for large result sets
4. **Cache tags** - they don't change often
5. **Show loading states** during API calls

---

## 📊 Available Tags Reference

Companies: Amazon, Google, Microsoft, Meta, Apple
Topics: Array, String, Tree, Graph, DP, Backtracking, etc.
Difficulty: Easy, Medium, Hard
Collections: LeetCode Top 75, Basics

---

## 🚀 Ready to Implement!

Start with the tag cloud, then add filters. Your users will love the company-specific problem sets!
