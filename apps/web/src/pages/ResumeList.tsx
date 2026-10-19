import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  UploadCloud,
  Eye,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  Check,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import pdfToText from 'react-pdftotext';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import ModernTemplate from '../components/templates/ModernTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import MinimalImageTemplate from '../components/templates/MinimalImageTemplate';

interface Resume {
  id: string;
  title: string;
  template: string;
  profile?: string;
  public: boolean;
  createdAt: string;
  updatedAt?: string;
  user?: {
    name?: string;
    avatar?: string;
  };
  professionSummary?: string;
  skills?: string[];
  personalInfo?: any;
  experience?: any[];
  projects?: any[];
  education?: any[];
  accentColor?: string;
}

const profileOptions = [
  'All',
  'General',
  'Fullstack',
  'Frontend',
  'Backend',
  'DevOps',
  'Data Science',
  'Mobile',
  'Cloud Engineer'
];

const cardBorderColors = [
  'border-blue-300 dark:border-blue-600',
  'border-emerald-300 dark:border-emerald-600',
  'border-purple-300 dark:border-purple-600',
  'border-pink-300 dark:border-pink-600',
  'border-amber-300 dark:border-amber-600',
  'border-indigo-300 dark:border-indigo-600'
];

export default function ResumeList() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [publicResumes, setPublicResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterProfile, setFilterProfile] = useState('All');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProfile, setNewProfile] = useState('General');
  const [creating, setCreating] = useState(false);

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProfile, setUploadProfile] = useState('General');
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal for Public Resumes
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetchResumes();
    fetchPublicResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to view your resumes');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/resume', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const data = await response.json();
      setResumes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
      setError('Failed to load resumes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicResumes = async () => {
    try {
      const response = await fetch('/api/resume/public-resumes');
      if (!response.ok) return;
      const data = await response.json();
      setPublicResumes(Array.isArray(data.resumes) ? data.resumes : []);
    } catch (err) {
      console.error('Failed to load public resumes:', err);
    }
  };

  const handleCreateResume = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim() || 'Untitled-resume',
          profile: newProfile || 'General',
          template: 'classic',
          accentColor: '#3B82F6',
          professionSummary: '',
          skills: [],
          personalInfo: {},
          experience: [],
          projects: [],
          education: [],
          public: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create resume');
      }

      const newResume = await response.json();
      setShowCreateModal(false);
      navigate(`/resume-builder/${newResume.id}`);
    } catch (err) {
      console.error('Failed to create resume:', err);
      setError('Failed to create resume. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadResume = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please sign in again before importing a resume.');
      }

      let extractedText = '';

      if (uploadMode === 'file') {
        if (!uploadFile) {
          setUploadError('Please select a resume file (PDF, TXT, or JSON).');
          setIsUploading(false);
          return;
        }

        if (uploadFile.type === 'application/pdf' || uploadFile.name.endsWith('.pdf')) {
          try {
            extractedText = await pdfToText(uploadFile);
          } catch (pdfErr) {
            console.error('pdfToText error:', pdfErr);
            throw new Error('Could not extract text from this PDF. Please copy and paste its text into the Paste tab.');
          }
        } else {
          extractedText = await uploadFile.text();
        }
      } else {
        extractedText = pasteText.trim();
        if (!extractedText) {
          setUploadError('Please paste your resume content into the textarea.');
          setIsUploading(false);
          return;
        }
      }

      if (!extractedText || extractedText.trim().length < 20) {
        setUploadError('Extracted text is too short or empty. Please ensure the file contains readable text.');
        setIsUploading(false);
        return;
      }

      const response = await fetch('/api/ai/upload-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: uploadTitle.trim() || uploadFile?.name.replace(/\.[^/.]+$/, '') || 'Imported Resume',
          profile: uploadProfile || 'General',
          resumeText: extractedText
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.resumeId) {
        throw new Error(data.message || data.error || 'Failed to parse resume with AI');
      }

      setShowUploadModal(false);
      navigate(`/resume-builder/${data.resumeId}`);
    } catch (err) {
      console.error('Upload resume error:', err);
      setUploadError(err instanceof Error ? err.message : 'An error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditResume = (id: string) => {
    navigate(`/resume-builder/${id}`);
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete resume');
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete resume. Please try again.');
    }
  };

  const handleDuplicateResume = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to duplicate resume');
      const duplicated = await response.json();
      setResumes((prev) => [duplicated, ...prev]);
    } catch (err) {
      console.error('Duplicate error:', err);
      setError('Failed to duplicate resume.');
    }
  };

  const handleClonePublicResume = async (publicRes: Resume) => {
    setCloning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${publicRes.title} (Copy)`,
          profile: publicRes.profile || 'General',
          template: publicRes.template || 'classic',
          accentColor: publicRes.accentColor || '#3B82F6',
          professionSummary: publicRes.professionSummary || '',
          skills: publicRes.skills || [],
          personalInfo: publicRes.personalInfo || {},
          experience: publicRes.experience || [],
          projects: publicRes.projects || [],
          education: publicRes.education || [],
          public: false
        })
      });

      if (!response.ok) throw new Error('Failed to clone resume');
      const created = await response.json();
      setPreviewResume(null);
      navigate(`/resume-builder/${created.id}`);
    } catch (err) {
      console.error('Clone public resume error:', err);
      alert('Could not clone resume. Please sign in and try again.');
    } finally {
      setCloning(false);
    }
  };

  const renderTemplatePreview = (res: Resume) => {
    const templates: Record<string, any> = {
      modern: ModernTemplate,
      classic: ClassicTemplate,
      minimal: MinimalTemplate,
      minimalImage: MinimalImageTemplate,
      'minimal-image': MinimalImageTemplate
    };
    const Component = templates[res.template] || ClassicTemplate;
    const templateData = {
      personal_info: res.personalInfo || {},
      professional_summary: res.professionSummary || '',
      experience: res.experience || [],
      education: res.education || [],
      project: res.projects || [],
      skills: res.skills || []
    };
    return <Component data={templateData} accentColor={res.accentColor || '#3B82F6'} />;
  };

  const filteredMyResumes = resumes.filter((r) => {
    if (filterProfile === 'All') return true;
    return (r.profile || 'General').toLowerCase() === filterProfile.toLowerCase();
  });

  const filteredPublicResumes = publicResumes.filter((r) => {
    if (filterProfile === 'All') return true;
    return (r.profile || 'General').toLowerCase() === filterProfile.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin text-primary" />
        Loading your resumes…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12">
      {/* Top Action Cards (Matching Image 1) */}
      <div className="flex flex-wrap gap-6 pt-4">
        {/* Create Resume Card */}
        <button
          type="button"
          onClick={() => {
            setNewTitle('Untitled-resume');
            setNewProfile('General');
            setShowCreateModal(true);
          }}
          className="group flex h-36 w-44 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-blue-900/60 dark:bg-card"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-950 dark:text-blue-400">
            <Plus className="size-6" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Create Resume</span>
        </button>

        {/* Upload Existing Card */}
        <button
          type="button"
          onClick={() => {
            setUploadTitle('');
            setUploadFile(null);
            setPasteText('');
            setUploadError('');
            setShowUploadModal(true);
          }}
          className="group flex h-36 w-44 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-indigo-200 bg-white p-4 transition-all hover:border-indigo-500 hover:shadow-md dark:border-indigo-900/60 dark:bg-card"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-950 dark:text-indigo-400">
            <UploadCloud className="size-6" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Upload Existing</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Section 1: My Resumes (Matching Image 1) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">My Resumes</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">Your personal resumes are shown first.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Filter by Profile:</span>
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-xs focus:border-primary focus:outline-none"
            >
              {profileOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMyResumes.length === 0 ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/20 text-sm text-muted-foreground dark:border-blue-900/40 dark:bg-blue-950/10">
            No resumes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMyResumes.map((resume, idx) => {
              const borderClass = cardBorderColors[idx % cardBorderColors.length];
              return (
                <div
                  key={resume.id}
                  className={`group relative flex flex-col justify-between rounded-xl border-2 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md ${borderClass}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-foreground truncate max-w-[200px]">{resume.title || 'Untitled resume'}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {resume.profile || 'General'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          resume.public ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {resume.public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span>Updated {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditResume(resume.id)}
                        className="rounded-lg p-1.5 hover:bg-primary/10 hover:text-primary transition"
                        title="Edit resume"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateResume(resume.id)}
                        className="rounded-lg p-1.5 hover:bg-primary/10 hover:text-primary transition"
                        title="Duplicate resume"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="rounded-lg p-1.5 hover:bg-destructive/10 hover:text-destructive transition"
                        title="Delete resume"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Public Resumes (Matching Image 1) */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Public Resumes</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">View resumes shared publicly by other users.</p>
          </div>
        </div>

        {filteredPublicResumes.length === 0 ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
            No public resumes found in this profile category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPublicResumes.map((pub, idx) => {
              const borderClass = cardBorderColors[idx % cardBorderColors.length];
              const authorName = pub.user?.name || 'CareerHub Member';
              const dateStr = new Date(pub.updatedAt || pub.createdAt).toLocaleDateString();

              return (
                <div
                  key={pub.id}
                  onClick={() => setPreviewResume(pub)}
                  className={`group relative flex min-h-[140px] cursor-pointer flex-col justify-between rounded-xl border-2 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-card ${borderClass}`}
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{pub.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{pub.profile || 'General'}</p>
                  </div>

                  <div className="mt-6 text-[11px] text-slate-500 dark:text-slate-400">
                    <p>By {authorName}</p>
                    <p className="mt-0.5">Updated on {dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Create New Resume</h2>
                <p className="text-xs text-muted-foreground mt-1">Start building your resume with your chosen profile template.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResume} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground">Resume Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Fullstack Developer Resume"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground">Profile Category</label>
                <select
                  value={newProfile}
                  onChange={(e) => setNewProfile(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {profileOptions.filter((o) => o !== 'All').map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {creating && <Loader2 className="size-4 animate-spin" />}
                  Create Resume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Existing Resume Modal (AI Powered Parsing) */}
      {showUploadModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isUploading && setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <Sparkles className="size-4" />
                  </span>
                  <h2 className="text-lg font-bold text-foreground">Upload & AI Parse Resume</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload an existing PDF or paste text. Our AI will automatically parse your experience, education, skills, and projects into the template format.
                </p>
              </div>
              <button
                disabled={isUploading}
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            {uploadError && (
              <div role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadResume} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground">Resume Title</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. My Imported Resume"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground">Profile Category</label>
                  <select
                    value={uploadProfile}
                    onChange={(e) => setUploadProfile(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    {profileOptions.filter((o) => o !== 'All').map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabs: Upload File vs Paste Text */}
              <div className="flex rounded-lg border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                    uploadMode === 'file' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Upload File (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('paste')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                    uploadMode === 'paste' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Paste Resume Text
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx,.json"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setUploadFile(file);
                        if (!uploadTitle) {
                          setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.02] p-8 text-center transition hover:border-primary/60 hover:bg-primary/[0.05]"
                  >
                    <UploadCloud className="size-10 text-primary/70" />
                    {uploadFile ? (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-foreground">{uploadFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB · Click to change file</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-foreground">Click to upload your resume</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">Supported formats: PDF, TXT, DOCX, JSON</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the plain text of your resume here (Summary, Experience, Education, Skills)..."
                    className="w-full resize-none rounded-xl border border-border bg-background p-3 text-xs leading-relaxed focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Parsing with AI…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Parse & Open in Template
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Public Resume Preview & Clone Modal */}
      {previewResume && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewResume(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-foreground">{previewResume.title}</h3>
                <p className="text-xs text-muted-foreground">
                  By {previewResume.user?.name || 'CareerHub Member'} · {previewResume.profile || 'General'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleClonePublicResume(previewResume)}
                  disabled={cloning}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {cloning ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
                  Clone & Customize
                </button>
                <button
                  onClick={() => setPreviewResume(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100 p-6 dark:bg-slate-900">
              <div className="mx-auto max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-card">
                {renderTemplatePreview(previewResume)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
