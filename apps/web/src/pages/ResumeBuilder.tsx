import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, FileText, User, Download, Eye, EyeOff, Sparkles, ArrowLeft, Share2 } from 'lucide-react';
import ModernTemplate from '../components/templates/ModernTemplate';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import MinimalImageTemplate from '../components/templates/MinimalImageTemplate';

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
    accentColor: '#3B82F6',
    public: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (resumeId && token) {
      loadExistingResume(resumeId);
    }
  }, [resumeId, token]);

  const loadExistingResume = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/resume/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data) {
        setResumeData(data);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResume = async () => {
    try {
      setIsSaving(true);
      const url = resumeId 
        ? `http://localhost:5000/api/resume/${resumeId}`
        : 'http://localhost:5000/api/resume';
      
      const method = resumeId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resumeData),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (!resumeId && data.id) {
          navigate(`/resume-builder/${data.id}`);
        }
        alert('Resume saved successfully!');
      } else {
        alert('Failed to save resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const url = resumeId 
        ? `http://localhost:5000/api/pdf/${resumeId}/pdf`
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
    const templates: Record<string, any> = {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-200 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
              <p className="text-gray-600">Create your professional resume</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        <div className={`grid ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume Title</label>
                  <input
                    type="text"
                    value={resumeData.title}
                    onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Resume"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                    <select
                      value={resumeData.template}
                      onChange={(e) => setResumeData({ ...resumeData, template: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                      <option value="minimalImage">Minimal with Image</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                    <input
                      type="color"
                      value={resumeData.accentColor}
                      onChange={(e) => setResumeData({ ...resumeData, accentColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.fullName || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, fullName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.profession || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, profession: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo.email || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={resumeData.personalInfo.phone || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.location || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={resumeData.personalInfo.linkedin || ''}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={resumeData.personalInfo.website || ''}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, website: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://johndoe.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Professional Summary
              </h2>
              <textarea
                value={resumeData.professionSummary}
                onChange={(e) => setResumeData({ ...resumeData, professionSummary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Write a brief professional summary..."
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Skills
              </h2>
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...resumeData.skills];
                        newSkills[index] = e.target.value;
                        setResumeData({ ...resumeData, skills: newSkills });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newSkills = resumeData.skills.filter((_, i) => i !== index);
                        setResumeData({ ...resumeData, skills: newSkills });
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setResumeData({ ...resumeData, skills: [...resumeData.skills, ''] })}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Skill
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={saveResume}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Resume'}
              </button>
              <button
                onClick={downloadPDF}
                disabled={!resumeId}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Print/Download PDF
              </button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <div className="border rounded-lg p-4 min-h-[500px] overflow-auto">
                  {getTemplateComponent()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;