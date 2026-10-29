import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  BriefcaseBusiness,
  GraduationCap,
  FileText,
  FolderIcon,
  Sparkles,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Globe,
  Download,
  Eye,
  EyeOff,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import ModernTemplate from '../components/templates/ModernTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import MinimalImageTemplate from '../components/templates/MinimalImageTemplate';
import TemplateSelector from '../components/TemplateSelector';
import ColorPicker from '../components/ColorPicker';
import ATSModal from '../components/ATSModal';
import CoverLetterModal from '../components/CoverLetterModal';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';

interface PersonalInfo {
  fullName?: string;
  profession?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  image?: string;
}

interface Experience {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrent?: boolean;
}

interface Project {
  name?: string;
  type?: string;
  description?: string;
  link?: string;
}

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  graduationDate?: string;
  gpa?: number;
}

interface ResumeData {
  id?: string;
  title: string;
  profile?: string;
  personalInfo: PersonalInfo;
  professionSummary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: string[];
  template: string;
  accentColor: string;
  public: boolean;
}

export default function ResumeBuilder() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState<ResumeData>({
    title: 'Untitled-resume',
    profile: 'General',
    personalInfo: {},
    professionSummary: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    template: 'classic',
    accentColor: '#3B82F6',
    public: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Modals
  const [showATSModal, setShowATSModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);

  // AI enhancement state for summary & descriptions
  const [isEnhancingSummary, setIsEnhancingSummary] = useState(false);
  const [enhancingExpIndex, setEnhancingExpIndex] = useState(-1);
  const [enhancingProjIndex, setEnhancingProjIndex] = useState(-1);
  const [newSkillInput, setNewSkillInput] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token');

  const hasContent = Boolean(
    resumeData.title.trim() ||
      Object.values(resumeData.personalInfo).some(Boolean) ||
      resumeData.professionSummary.trim() ||
      resumeData.experience.length ||
      resumeData.education.length ||
      resumeData.projects.length ||
      resumeData.skills.length
  );
  const isDirty = savedSnapshot === null ? hasContent : savedSnapshot !== JSON.stringify(resumeData);
  useUnsavedChangesWarning(isDirty && !isSaving);

  const sections = [
    { id: 'profile', name: 'Profile Info', icon: User },
    { id: 'summary', name: 'Summary', icon: FileText },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'projects', name: 'Projects', icon: FolderIcon },
    { id: 'skills', name: 'Skills', icon: Sparkles }
  ];

  const loadVersionRef = useRef(0);
  useEffect(() => {
    if (resumeId && token) {
      loadExistingResume(resumeId);
    }
    return () => { loadVersionRef.current += 1; };
  }, [resumeId, token]);

  const loadExistingResume = async (id: string) => {
    const version = ++loadVersionRef.current;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load resume');
      const data = await response.json();
      if (version !== loadVersionRef.current) return;
      if (data) {
        const loaded: ResumeData = {
          id: data.id,
          title: data.title || 'Untitled-resume',
          profile: data.profile || 'General',
          personalInfo: data.personalInfo || {},
          professionSummary: data.professionSummary || '',
          experience: Array.isArray(data.experience) ? data.experience : [],
          education: Array.isArray(data.education) ? data.education : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          skills: Array.isArray(data.skills) ? data.skills : [],
          template: data.template || 'classic',
          accentColor: data.accentColor || '#3B82F6',
          public: Boolean(data.public)
        };
        setResumeData(loaded);
        setSavedSnapshot(JSON.stringify(loaded));
        setSaveFeedback(null);
      }
    } catch (err) {
      if (version !== loadVersionRef.current) return;
      console.error('Error loading resume:', err);
      setSaveFeedback({ type: 'error', message: 'Could not load resume. Please try again.' });
    } finally {
      if (version === loadVersionRef.current) setIsLoading(false);
    }
  };

  const saveResume = async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setSaveFeedback(null);
      const url = resumeId ? `/api/resume/${resumeId}` : '/api/resume';
      const method = resumeId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(resumeData)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSavedSnapshot(JSON.stringify(resumeData));
        setSaveFeedback({ type: 'success', message: 'Resume saved successfully!' });
        if (!resumeId && data.id) {
          navigate(`/resume-builder/${data.id}`, { replace: true });
        }
        return true;
      } else {
        setSaveFeedback({ type: 'error', message: data?.error || data?.message || 'Failed to save resume' });
        return false;
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveFeedback({ type: 'error', message: 'Could not save resume. Check your connection.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = async () => {
    const newPublicState = !resumeData.public;
    setResumeData((prev) => ({ ...prev, public: newPublicState }));
    if (resumeId) {
      try {
        await fetch(`/api/resume/${resumeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ public: newPublicState })
        });
        setSaveFeedback({
          type: 'success',
          message: newPublicState ? 'Resume is now publicly visible.' : 'Resume is now private.'
        });
      } catch (err) {
        console.error('Visibility update error:', err);
      }
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: resumeData.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Resume link copied to clipboard!');
    }
  };

  const printResumePreview = () => {
    const resumeDocument = document.querySelector<HTMLElement>('.resume-print-document');
    if (!resumeDocument) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download your resume.');
      return;
    }

    printWindow.opener = null;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((style) => style.outerHTML)
      .join('\n');
    let printStarted = false;
    const startPrint = () => {
      if (printStarted) return;
      printStarted = true;
      const page = printWindow.document.querySelector<HTMLElement>('.resume-print-document');
      const content = page?.firstElementChild as HTMLElement | null;
      if (page && content && content.scrollHeight > page.clientHeight) {
        const scale = page.clientHeight / content.scrollHeight;
        content.style.zoom = String(scale);
        content.style.width = `${100 / scale}%`;
      }
      printWindow.focus();
      printWindow.print();
    };
    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>Resume</title>${styles}
      <style>
        @page { size: A4; margin: 0; }
        html, body { width: 210mm; height: 297mm; margin: 0; background: #fff; }
        body { color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .resume-print-document { width: 210mm; height: 297mm; overflow: hidden; box-sizing: border-box; background: #fff; }
        .resume-print-document > div { width: 100% !important; max-width: none !important; min-height: 100% !important; height: auto !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #fff !important; }
        @media print {
          html, body { width: 210mm; height: 297mm; margin: 0 !important; }
          .resume-print-document { page-break-after: avoid; }
          .resume-print-document section { break-inside: avoid; }
        }
      </style></head><body>${resumeDocument.outerHTML}</body></html>`);
    printWindow.document.close();
    if (printWindow.document.readyState === 'complete') {
      printWindow.setTimeout(startPrint, 250);
    } else {
      printWindow.addEventListener('load', () => printWindow.setTimeout(startPrint, 250), { once: true });
    }
  };

  const handleDownload = async () => {
    if (!resumeId) {
      printResumePreview();
      return;
    }

    try {
      const response = await fetch(`/api/pdf/${resumeId}/pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'PDF generation failed');
      }

      const pdfUrl = URL.createObjectURL(await response.blob());
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `${resumeData.title.replace(/[^a-z0-9_-]+/gi, '_') || 'resume'}.pdf`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Resume PDF download failed:', error);
      alert('Could not generate the PDF. Opening the print preview instead.');
      printResumePreview();
    }
  };

  // AI Summary Enhancement
  const handleEnhanceSummary = async () => {
    if (!resumeData.professionSummary.trim()) {
      alert('Please write some summary points first before enhancing.');
      return;
    }
    setIsEnhancingSummary(true);
    try {
      const response = await fetch('/api/ai/enhance-pro-sum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userContent: resumeData.professionSummary })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.enhancedSolution) {
        setResumeData((prev) => ({ ...prev, professionSummary: data.enhancedSolution }));
      } else {
        alert(data.error || data.message || 'AI enhancement failed');
      }
    } catch (err) {
      console.error('Enhance summary error:', err);
      alert('AI enhancement failed. Please try again.');
    } finally {
      setIsEnhancingSummary(false);
    }
  };

  // AI Experience Description Enhancement
  const handleEnhanceExperience = async (index: number) => {
    const exp = resumeData.experience[index];
    if (!exp?.description?.trim()) {
      alert('Please enter a description for this experience first.');
      return;
    }
    setEnhancingExpIndex(index);
    try {
      const response = await fetch('/api/ai/enhance-job-desc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entryType: 'experience',
          title: exp.position || '',
          organization: exp.company || '',
          userContent: exp.description
        })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.enhancedSolution) {
        const updated = [...resumeData.experience];
        updated[index] = { ...updated[index], description: data.enhancedSolution };
        setResumeData((prev) => ({ ...prev, experience: updated }));
      } else {
        alert(data.error || data.message || 'AI enhancement failed');
      }
    } catch (err) {
      console.error('Enhance experience error:', err);
    } finally {
      setEnhancingExpIndex(-1);
    }
  };

  // AI Project Description Enhancement
  const handleEnhanceProject = async (index: number) => {
    const proj = resumeData.projects[index];
    if (!proj?.description?.trim()) {
      alert('Please enter a description for this project first.');
      return;
    }
    setEnhancingProjIndex(index);
    try {
      const response = await fetch('/api/ai/enhance-job-desc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entryType: 'project',
          title: proj.name || '',
          projectType: proj.type || '',
          userContent: proj.description
        })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.enhancedSolution) {
        const updated = [...resumeData.projects];
        updated[index] = { ...updated[index], description: data.enhancedSolution };
        setResumeData((prev) => ({ ...prev, projects: updated }));
      } else {
        alert(data.error || data.message || 'AI enhancement failed');
      }
    } catch (err) {
      console.error('Enhance project error:', err);
    } finally {
      setEnhancingProjIndex(-1);
    }
  };

  // Avatar Image Upload
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResumeData((prev) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, image: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Render Template Component for Preview
  const getTemplateComponent = () => {
    const templates: Record<string, any> = {
      modern: ModernTemplate,
      classic: ClassicTemplate,
      minimal: MinimalTemplate,
      minimalImage: MinimalImageTemplate,
      'minimal-image': MinimalImageTemplate
    };
    const Component = templates[resumeData.template] || ClassicTemplate;
    const templateData = {
      personal_info: {
        full_name: resumeData.personalInfo.fullName,
        profession: resumeData.personalInfo.profession,
        email: resumeData.personalInfo.email,
        phone: resumeData.personalInfo.phone,
        location: resumeData.personalInfo.location,
        linkedin: resumeData.personalInfo.linkedin,
        website: resumeData.personalInfo.website,
        image: resumeData.personalInfo.image
      },
      professional_summary: resumeData.professionSummary,
      experience: resumeData.experience.map((exp) => ({
        position: exp.position,
        company: exp.company,
        start_date: exp.startDate,
        end_date: exp.endDate,
        is_current: exp.isCurrent,
        description: exp.description
      })),
      project: resumeData.projects,
      education: resumeData.education.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        graduation_date: edu.graduationDate,
        gpa: edu.gpa
      })),
      skills: resumeData.skills
    };
    return <Component data={templateData} accentColor={resumeData.accentColor} />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-6 animate-spin text-primary" />
        Loading your resume…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:m-0 print:p-0">
      {/* Top Header Bar matching Reference Image 2 & 4 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4 print:hidden">
        {/* Back to Dashboard Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-semibold text-slate-600 shadow-xs transition-all hover:border-cyan-300 hover:bg-emerald-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Action Pills Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Share Button (if public) */}
          {resumeData.public && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-xs ring-1 ring-blue-300 transition-all hover:ring-2 hover:ring-blue-400 dark:from-blue-950 dark:to-blue-900 dark:text-blue-200"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </button>
          )}

          {/* Visibility Toggle Pill */}
          <button
            type="button"
            onClick={toggleVisibility}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 px-3.5 py-1.5 text-xs font-semibold text-purple-700 shadow-xs ring-1 ring-purple-300 transition-all hover:ring-2 hover:ring-purple-400 dark:from-purple-950 dark:to-purple-900 dark:text-purple-200"
          >
            {resumeData.public ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            <span>{resumeData.public ? 'Public' : 'Private'}</span>
          </button>

          {/* ATS Score Pill */}
          <button
            type="button"
            onClick={() => setShowATSModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-300 px-3.5 py-1.5 text-xs font-semibold text-purple-800 shadow-xs ring-1 ring-purple-300 transition-all hover:ring-2 hover:ring-purple-500 dark:from-purple-950 dark:to-purple-900 dark:text-purple-200"
          >
            <span>🎯</span>
            <span>ATS Score</span>
          </button>

          {/* Cover Letter Pill */}
          <button
            type="button"
            onClick={() => setShowCoverLetterModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs ring-1 ring-emerald-300 transition-all hover:ring-2 hover:ring-emerald-500 dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-200"
          >
            <span>📝</span>
            <span>Cover Letter</span>
          </button>

          {/* Download PDF Pill */}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-green-100 to-green-200 px-4 py-1.5 text-xs font-semibold text-green-700 shadow-xs ring-1 ring-green-300 transition-all hover:ring-2 hover:ring-green-500 dark:from-green-950 dark:to-green-900 dark:text-green-200"
          >
            <Download className="size-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="flex gap-2 md:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
            mobileView === 'editor' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Edit Resume Form
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
            mobileView === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* Two-Column Layout (Matching Image 2, 3, 4) */}
      <div className="grid gap-8 lg:grid-cols-12 print:block">
        {/* Left Column: Form Panel (5 cols on lg) */}
        <div
          className={`relative rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-border dark:bg-card lg:col-span-5 print:hidden ${
            mobileView === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Top Progress Line Indicator */}
          <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden rounded-t-2xl bg-amber-100 dark:bg-muted">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
              style={{ width: `${((activeSectionIndex + 1) / sections.length) * 100}%` }}
            />
          </div>

          {/* Subheader Toolbar: Template & Accent Selectors + Previous/Next Buttons */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3 pt-2 dark:border-border">
            <div className="flex items-center gap-2">
              <TemplateSelector
                selectedTemplate={resumeData.template}
                onChange={(template) => setResumeData((prev) => ({ ...prev, template }))}
              />
              <ColorPicker
                selectedColor={resumeData.accentColor}
                onChange={(color) => setResumeData((prev) => ({ ...prev, accentColor: color }))}
              />
            </div>

            <div className="flex items-center gap-1">
              {activeSectionIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSectionIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-muted"
                >
                  <ChevronLeft className="size-4" />
                  <span>Previous</span>
                </button>
              )}
              {activeSectionIndex < sections.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveSectionIndex((prev) => Math.min(sections.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-muted"
                >
                  <span>Next</span>
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stepped Form Content */}
          <div className="space-y-6">
            {/* Step 0: Personal Information (Image 2) */}
            {activeSectionIndex === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Personal Information</h3>
                  <p className="text-xs text-muted-foreground">Get started with personal information</p>
                </div>

                {/* Avatar / Profile Image Upload */}
                <div className="flex items-center gap-4 py-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="group relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-muted/40 transition hover:border-primary"
                  >
                    {resumeData.personalInfo.image ? (
                      <img
                        src={resumeData.personalInfo.image}
                        alt="Profile avatar"
                        className="size-full object-cover"
                      />
                    ) : (
                      <User className="size-8 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {resumeData.personalInfo.image ? 'Change user image' : 'Upload user image'}
                    </button>
                    {resumeData.personalInfo.image && (
                      <button
                        type="button"
                        onClick={() =>
                          setResumeData((prev) => ({
                            ...prev,
                            personalInfo: { ...prev.personalInfo, image: '' }
                          }))
                        }
                        className="block text-[11px] text-destructive hover:underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Fields matching Image 2 */}
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <User className="size-3.5" />
                      <span>Full Name*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resumeData.personalInfo.fullName || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                        }))
                      }
                      placeholder="Enter your full name"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Mail className="size-3.5" />
                      <span>Email*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={resumeData.personalInfo.email || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))
                      }
                      placeholder="Enter your email"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Phone className="size-3.5" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      value={resumeData.personalInfo.phone || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))
                      }
                      placeholder="Enter your phone number"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <MapPin className="size-3.5" />
                      <span>Location</span>
                    </label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.location || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, location: e.target.value }
                        }))
                      }
                      placeholder="Enter your location (e.g. San Francisco, CA)"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <BriefcaseBusiness className="size-3.5" />
                      <span>Profession*</span>
                    </label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.profession || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, profession: e.target.value }
                        }))
                      }
                      placeholder="e.g. Senior Fullstack Engineer"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Shield className="size-3.5" />
                      <span>LinkedIn Profile</span>
                    </label>
                    <input
                      type="url"
                      value={resumeData.personalInfo.linkedin || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                        }))
                      }
                      placeholder="https://linkedin.com/in/username"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Globe className="size-3.5" />
                      <span>Portfolio / Website</span>
                    </label>
                    <input
                      type="url"
                      value={resumeData.personalInfo.website || ''}
                      onChange={(e) =>
                        setResumeData((prev) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, website: e.target.value }
                        }))
                      }
                      placeholder="https://yourportfolio.com"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Professional Summary (Image 4) */}
            {activeSectionIndex === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Professional Summary</h3>
                  <button
                    type="button"
                    disabled={isEnhancingSummary}
                    onClick={handleEnhanceSummary}
                    className="inline-flex items-center gap-1.5 rounded-md bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-200 disabled:opacity-50 dark:bg-purple-950 dark:text-purple-300"
                  >
                    {isEnhancingSummary ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    <span>{isEnhancingSummary ? 'Enhancing…' : 'AI Enhance'}</span>
                  </button>
                </div>

                <div>
                  <textarea
                    rows={8}
                    value={resumeData.professionSummary}
                    onChange={(e) => setResumeData((prev) => ({ ...prev, professionSummary: e.target.value }))}
                    placeholder="Write a compelling professional summary"
                    className="w-full resize-none rounded-xl border border-gray-300 bg-background p-4 text-xs leading-relaxed focus:border-blue-500 focus:outline-none dark:border-border"
                  />
                  <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Tip : </span>
                    Please keep it concise
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Work Experience */}
            {activeSectionIndex === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Work Experience</h3>
                    <p className="text-xs text-muted-foreground">Add your professional work history</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setResumeData((prev) => ({
                        ...prev,
                        experience: [
                          ...prev.experience,
                          {
                            company: '',
                            position: '',
                            startDate: '',
                            endDate: '',
                            description: '',
                            isCurrent: false
                          }
                        ]
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <Plus className="size-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {resumeData.experience.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No work experience added yet. Click "+ Add" above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">Experience #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                experience: prev.experience.filter((_, i) => i !== index)
                              }))
                            }
                            className="text-destructive hover:opacity-80"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Position / Title"
                            value={exp.position || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[index] = { ...updated[index], position: e.target.value };
                              setResumeData((prev) => ({ ...prev, experience: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={exp.company || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[index] = { ...updated[index], company: e.target.value };
                              setResumeData((prev) => ({ ...prev, experience: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Start Date (e.g. Jan 2022)"
                            value={exp.startDate || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[index] = { ...updated[index], startDate: e.target.value };
                              setResumeData((prev) => ({ ...prev, experience: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            disabled={exp.isCurrent}
                            placeholder={exp.isCurrent ? 'Present' : 'End Date (e.g. Dec 2023)'}
                            value={exp.isCurrent ? '' : exp.endDate || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[index] = { ...updated[index], endDate: e.target.value };
                              setResumeData((prev) => ({ ...prev, experience: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none disabled:bg-muted"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(exp.isCurrent)}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[index] = { ...updated[index], isCurrent: e.target.checked };
                              setResumeData((prev) => ({ ...prev, experience: updated }));
                            }}
                            className="rounded border-border"
                          />
                          <span>Currently working here</span>
                        </label>

                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-muted-foreground">Description</span>
                            <button
                              type="button"
                              disabled={enhancingExpIndex === index}
                              onClick={() => handleEnhanceExperience(index)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline disabled:opacity-50"
                            >
                              {enhancingExpIndex === index ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Sparkles className="size-3" />
                              )}
                              <span>AI Enhance</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Describe achievements, responsibilities, and technologies used..."
                            value={exp.description || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.experience];
                              updated[index] = { ...updated[index], description: e.target.value };
                              setResumeData((prev) => ({ ...prev, experience: updated }));
                            }}
                            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Education */}
            {activeSectionIndex === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Education</h3>
                    <p className="text-xs text-muted-foreground">Degrees, colleges, and certifications</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setResumeData((prev) => ({
                        ...prev,
                        education: [
                          ...prev.education,
                          { institution: '', degree: '', field: '', graduationDate: '', gpa: undefined }
                        ]
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <Plus className="size-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {resumeData.education.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No education added yet. Click "+ Add" above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {resumeData.education.map((edu, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">Education #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                education: prev.education.filter((_, i) => i !== index)
                              }))
                            }
                            className="text-destructive hover:opacity-80"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Institution / University"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.education];
                              updated[index] = { ...updated[index], institution: e.target.value };
                              setResumeData((prev) => ({ ...prev, education: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Degree (e.g. B.Tech, BS)"
                            value={edu.degree || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.education];
                              updated[index] = { ...updated[index], degree: e.target.value };
                              setResumeData((prev) => ({ ...prev, education: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Field of Study (e.g. Computer Science)"
                            value={edu.field || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.education];
                              updated[index] = { ...updated[index], field: e.target.value };
                              setResumeData((prev) => ({ ...prev, education: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Graduation Year / Date"
                            value={edu.graduationDate || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.education];
                              updated[index] = { ...updated[index], graduationDate: e.target.value };
                              setResumeData((prev) => ({ ...prev, education: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Projects */}
            {activeSectionIndex === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Projects</h3>
                    <p className="text-xs text-muted-foreground">Highlight relevant personal and academic projects</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setResumeData((prev) => ({
                        ...prev,
                        projects: [...prev.projects, { name: '', type: '', description: '', link: '' }]
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <Plus className="size-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {resumeData.projects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No projects added yet. Click "+ Add" above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {resumeData.projects.map((proj, index) => (
                      <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">Project #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setResumeData((prev) => ({
                                ...prev,
                                projects: prev.projects.filter((_, i) => i !== index)
                              }))
                            }
                            className="text-destructive hover:opacity-80"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Project Title"
                            value={proj.name || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.projects];
                              updated[index] = { ...updated[index], name: e.target.value };
                              setResumeData((prev) => ({ ...prev, projects: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Type (e.g. Web App, AI Agent)"
                            value={proj.type || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.projects];
                              updated[index] = { ...updated[index], type: e.target.value };
                              setResumeData((prev) => ({ ...prev, projects: updated }));
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>

                        <input
                          type="url"
                          placeholder="Project URL (e.g. GitHub or Live Demo)"
                          value={proj.link || ''}
                          onChange={(e) => {
                            const updated = [...resumeData.projects];
                            updated[index] = { ...updated[index], link: e.target.value };
                            setResumeData((prev) => ({ ...prev, projects: updated }));
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                        />

                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-muted-foreground">Description</span>
                            <button
                              type="button"
                              disabled={enhancingProjIndex === index}
                              onClick={() => handleEnhanceProject(index)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline disabled:opacity-50"
                            >
                              {enhancingProjIndex === index ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Sparkles className="size-3" />
                              )}
                              <span>AI Enhance</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Describe architecture, tech stack, and key results..."
                            value={proj.description || ''}
                            onChange={(e) => {
                              const updated = [...resumeData.projects];
                              updated[index] = { ...updated[index], description: e.target.value };
                              setResumeData((prev) => ({ ...prev, projects: updated }));
                            }}
                            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Skills */}
            {activeSectionIndex === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-foreground">Skills</h3>
                  <p className="text-xs text-muted-foreground">Languages, frameworks, databases, and tools</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSkillInput.trim() && !resumeData.skills.includes(newSkillInput.trim())) {
                          setResumeData((prev) => ({
                            ...prev,
                            skills: [...prev.skills, newSkillInput.trim()]
                          }));
                          setNewSkillInput('');
                        }
                      }
                    }}
                    placeholder="Type skill & press Enter (e.g. React, Docker, Python)"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillInput.trim() && !resumeData.skills.includes(newSkillInput.trim())) {
                        setResumeData((prev) => ({
                          ...prev,
                          skills: [...prev.skills, newSkillInput.trim()]
                        }));
                        setNewSkillInput('');
                      }
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {resumeData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          setResumeData((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((_, i) => i !== index)
                          }))
                        }
                        className="hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save Changes Button (Matching Image 4) */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-border">
            <button
              type="button"
              onClick={() => void saveResume()}
              disabled={isSaving}
              className="rounded-md bg-gradient-to-br from-green-100 to-green-200 px-6 py-2 text-sm font-semibold text-green-700 ring-2 ring-green-200 transition-all hover:ring-green-400 disabled:opacity-50 dark:from-green-950 dark:to-green-900 dark:text-green-200 dark:ring-green-800"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>

            {saveFeedback && (
              <span
                className={`text-xs font-medium ${
                  saveFeedback.type === 'error' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {saveFeedback.message}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Live Resume Document Preview (7 cols on lg) */}
        <div
          className={`min-h-[750px] lg:col-span-7 print:w-full ${
            mobileView === 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-slate-100 p-4 shadow-xl dark:border-border dark:bg-slate-900 print:m-0 print:border-none print:p-0 print:shadow-none">
            <div className="resume-print-document mx-auto max-w-[850px] overflow-hidden rounded-sm bg-white shadow-2xl dark:bg-card print:shadow-none">
              {getTemplateComponent()}
            </div>
          </div>
        </div>
      </div>

      {/* ATS Score Modal */}
      {showATSModal && resumeId && (
        <ATSModal isOpen={showATSModal} onClose={() => setShowATSModal(false)} resumeId={resumeId} />
      )}

      {/* Cover Letter Modal */}
      {showCoverLetterModal && resumeId && (
        <CoverLetterModal
          isOpen={showCoverLetterModal}
          onClose={() => setShowCoverLetterModal(false)}
          resumeId={resumeId}
        />
      )}
    </div>
  );
}
