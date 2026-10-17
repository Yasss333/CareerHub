import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, FileText, User, Download, Eye, EyeOff, Sparkles, ArrowLeft, MessageSquare, FileQuestion } from 'lucide-react';
import ModernTemplate from '../components/templates/ModernTemplate';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import MinimalImageTemplate from '../components/templates/MinimalImageTemplate';
import ExperienceForm from '../components/ExperienceForm';
import EducationForm from '../components/EducationForm';
import ProjectForm from '../components/ProjectForm';
import SkillsForm from '../components/SkillsForm';
import ProfessionalSummaryForm from '../components/ProfessionalSummaryForm';
import ATSModal from '../components/ATSModal';
import CoverLetterModal from '../components/CoverLetterModal';
import InterviewModal from '../components/InterviewModal';
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
  position?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

interface Project {
  name?: string;
  type?: string;
  description?: string;
}

interface Education {
  degree?: string;
  field?: string;
  institution?: string;
  graduationDate?: string;
  gpa?: number;
}

interface ResumeData {
  id?: string;
  title: string;
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

const ResumeBuilder = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState<ResumeData>({
    title: '',
    personalInfo: {},
    professionSummary: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    template: 'modern',
    accentColor: '#9333EA',
    public: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [currentStep, setCurrentStep] = useState(0);
  const [showATSModal, setShowATSModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  const token = localStorage.getItem('token');
  const hasResumeContent = Boolean(
    resumeData.title.trim()
    || Object.values(resumeData.personalInfo).some(Boolean)
    || resumeData.professionSummary.trim()
    || resumeData.experience.length
    || resumeData.education.length
    || resumeData.projects.length
    || resumeData.skills.length
  );
  const isDirty = savedSnapshot === null ? hasResumeContent : savedSnapshot !== JSON.stringify(resumeData);
  useUnsavedChangesWarning(isDirty && !isSaving);

  useEffect(() => {
    if (resumeId && token) {
      loadExistingResume(resumeId);
    }
  }, [resumeId, token]);

  const loadExistingResume = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data) {
        setResumeData(data);
        setSavedSnapshot(JSON.stringify(data));
        setSaveFeedback(null);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      setSaveFeedback({ type: 'error', message: 'Could not load this resume. Check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveResume = async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setSaveFeedback(null);
      const url = resumeId 
        ? `/api/resume/${resumeId}`
        : '/api/resume';
      
      const method = resumeId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resumeData),
      });

      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        setSavedSnapshot(JSON.stringify(resumeData));
        setSaveFeedback({ type: 'success', message: 'All changes saved.' });
        if (!resumeId && data.id) {
          navigate(`/resume-builder/${data.id}`);
        }
        return true;
      } else {
        const message = data?.error || data?.message || 'Failed to save resume';
        setSaveFeedback({ type: 'error', message });
        return false;
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveFeedback({ type: 'error', message: 'Could not save your resume. Check your connection and try again.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { title: 'Profile', description: 'Resume style and contact information' },
    { title: 'Experience', description: 'Your work history' },
    { title: 'Education', description: 'Degrees and education' },
    { title: 'Projects', description: 'Selected work and projects' },
    { title: 'Skills', description: 'Summary and key skills' },
    { title: 'Review', description: 'Preview, save, and export' },
  ];

  const advanceStep = async () => {
    if (currentStep >= steps.length - 1) return;
    const saved = await saveResume();
    if (saved) setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const downloadPDF = async () => {
    try {
      const url = resumeId 
        ? `/api/pdf/${resumeId}/pdf`
        : null;
      
      if (!url) {
        alert('Please save the resume first');
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const htmlContent = await response.text();
        
        // Create a new window with the HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Wait for the content to load before printing
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  const getTemplateComponent = () => {
    const templates: Record<string, typeof ModernTemplate> = {
      modern: ModernTemplate,
      classic: ClassicTemplate,
      minimal: MinimalTemplate,
      minimalImage: MinimalImageTemplate,
    };
    const TemplateComponent = templates[resumeData.template] || ModernTemplate;
    
    // Convert data format for templates
    const templateData = {
      personal_info: {
        full_name: resumeData.personalInfo.fullName,
        profession: resumeData.personalInfo.profession,
        email: resumeData.personalInfo.email,
        phone: resumeData.personalInfo.phone,
        location: resumeData.personalInfo.location,
        linkedin: resumeData.personalInfo.linkedin,
        website: resumeData.personalInfo.website,
        image: resumeData.personalInfo.image,
      },
      professional_summary: resumeData.professionSummary,
      experience: resumeData.experience.map(exp => ({
        position: exp.position,
        company: exp.company,
        start_date: exp.startDate,
        end_date: exp.endDate,
        is_current: exp.isCurrent,
        description: exp.description,
      })),
      project: resumeData.projects,
      education: resumeData.education.map(edu => ({
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution,
        graduation_date: edu.graduationDate,
        gpa: edu.gpa,
      })),
      skills: resumeData.skills,
    };

    return <TemplateComponent data={templateData} accentColor={resumeData.accentColor} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading your resume…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => {
              if (!isDirty || window.confirm('Leave this resume? Your unsaved changes will be lost.')) navigate('/');
            }} aria-label="Back to dashboard" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Resume Builder</h1>
              <p className="text-muted-foreground">Build a polished resume one focused step at a time.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="hidden items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted md:flex"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

      {(isSaving || saveFeedback || isDirty) && (
        <div
          role={saveFeedback?.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            saveFeedback?.type === 'error'
              ? 'border-destructive/25 bg-destructive/5 text-destructive'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <span className={`size-2 shrink-0 rounded-full ${isSaving ? 'animate-pulse bg-primary' : saveFeedback?.type === 'error' ? 'bg-destructive' : isDirty ? 'bg-warning' : 'bg-success'}`} />
          {isSaving
            ? 'Saving your resume…'
            : saveFeedback?.type === 'error'
              ? saveFeedback.message
              : isDirty
                ? 'You have unsaved changes.'
                : saveFeedback?.message || 'All changes saved.'}
        </div>
      )}

        <nav aria-label="Resume sections" className="mb-6 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm sm:p-4">
          <ol className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {steps.map((step, index) => (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  aria-current={currentStep === index ? 'step' : undefined}
                  className={`w-full rounded-lg px-2 py-2 text-left transition-colors ${
                    currentStep === index
                      ? 'bg-primary text-white'
                      : index < currentStep
                        ? 'bg-primary/5 text-primary hover:bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="block text-xs font-medium">Step {index + 1}</span>
                  <span className="block truncate text-sm font-semibold">{step.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            <p className="shrink-0 text-xs text-muted-foreground">{currentStep + 1} of {steps.length}</p>
          </div>
          <div className="mt-3 flex gap-2 md:hidden" role="tablist" aria-label="Editor and preview">
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === 'editor'}
              onClick={() => setMobileView('editor')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mobileView === 'editor' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              Edit section
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === 'preview'}
              onClick={() => { setShowPreview(true); setMobileView('preview'); }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mobileView === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              Preview
            </button>
          </div>
        </nav>

        <div className={`grid ${showPreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Form Section */}
          <div className={`min-w-0 space-y-6 ${mobileView === 'preview' ? 'hidden md:block' : ''}`}>
            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 0 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Resume Title</label>
                  <input
                    type="text"
                    value={resumeData.title}
                    onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="My Resume"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Template</label>
                    <select
                      value={resumeData.template}
                      onChange={(e) => setResumeData({ ...resumeData, template: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                      <option value="minimalImage">Minimal with Image</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Accent Color</label>
                    <input
                      type="color"
                      value={resumeData.accentColor}
                      onChange={(e) => setResumeData({ ...resumeData, accentColor: e.target.value })}
                      className="w-full h-10 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 0 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.fullName || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, fullName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Profession</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.profession || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, profession: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo.email || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                    <input
                      type="tel"
                      value={resumeData.personalInfo.phone || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.location || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={resumeData.personalInfo.linkedin || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Website</label>
                  <input
                    type="url"
                    value={resumeData.personalInfo.website || ''}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, website: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://johndoe.com"
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 4 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Professional Summary
              </h2>
              <ProfessionalSummaryForm 
                value={resumeData.professionSummary} 
                onChange={(value) => setResumeData({ ...resumeData, professionSummary: value })} 
              />
            </div>

            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 4 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Skills
              </h2>
              <SkillsForm data={resumeData.skills} onChange={(skills) => setResumeData({ ...resumeData, skills })} />
            </div>

            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 1 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Work Experience
              </h2>
              <ExperienceForm data={resumeData.experience} onChange={(experience) => setResumeData({ ...resumeData, experience })} />
            </div>

            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 2 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </h2>
              <EducationForm data={resumeData.education} onChange={(education) => setResumeData({ ...resumeData, education })} />
            </div>

            <div className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${currentStep === 3 ? '' : 'hidden'}`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Projects
              </h2>
              <ProjectForm data={resumeData.projects} onChange={(projects) => setResumeData({ ...resumeData, projects })} />
            </div>

            {currentStep === steps.length - 1 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                <h2 className="text-lg font-semibold text-foreground">Review your resume</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check the live preview, then save or export your resume. You can return to any section above.
                </p>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    ['Contact information', Boolean(resumeData.personalInfo.fullName)],
                    ['Professional summary', Boolean(resumeData.professionSummary.trim())],
                    ['Work experience', resumeData.experience.length > 0],
                    ['Education', resumeData.education.length > 0],
                    ['Projects', resumeData.projects.length > 0],
                    ['Skills', resumeData.skills.length > 0],
                  ].map(([label, complete]) => (
                    <p key={String(label)}>
                      <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${complete ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {complete ? 'Added' : 'Not added'}
                      </span>
                      {label}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                  className="rounded-lg border border-border px-4 py-2 text-foreground transition-colors hover:bg-muted"
                >
                  Previous
                </button>
              )}
              {currentStep < steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => void advanceStep()}
                  disabled={isSaving}
                  className="rounded-md bg-primary px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save and continue'}
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => void saveResume()}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : isDirty ? 'Save changes' : 'Resume saved'}
              </button>
              <button
                onClick={downloadPDF}
                disabled={!resumeId}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Print/Download PDF
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowATSModal(true)}
                disabled={!resumeId}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                <FileQuestion className="w-4 h-4" />
                ATS Analysis
              </button>
              <button
                onClick={() => setShowCoverLetterModal(true)}
                disabled={!resumeId}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                Cover Letter
              </button>
              <button
                onClick={() => setShowInterviewModal(true)}
                disabled={!resumeId}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Interview Prep
              </button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className={`min-w-0 space-y-6 md:sticky md:top-4 md:self-start ${mobileView === 'editor' ? 'hidden md:block' : ''}`}>
              <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm md:p-6">
                <h2 className="text-xl font-semibold mb-4">Live preview</h2>
                <div className="min-h-[500px] overflow-auto rounded-xl border border-border bg-background p-4">
                  {getTemplateComponent()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Modals */}
      <ATSModal
        isOpen={showATSModal}
        onClose={() => setShowATSModal(false)}
        resumeId={resumeId || ''}
      />
      <CoverLetterModal
        isOpen={showCoverLetterModal}
        onClose={() => setShowCoverLetterModal(false)}
        resumeId={resumeId || ''}
      />
      <InterviewModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        resumeId={resumeId || ''}
      />
    </div>
  );
};

export default ResumeBuilder;
