import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, Target, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface Template {
  key: string;
  title: string;
  description: string;
  milestoneCount: number;
}

const skillLevels = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced professional' }
];

export default function RoadmapBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [userGoals, setUserGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTemplates = async () => {
    try {
      const data = await api<{ templates: Template[] }>('/roadmaps/templates');
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api<{ roadmap: any }>('/roadmaps/generate', {
        method: 'POST',
        body: JSON.stringify({
          roleType: selectedTemplate,
          skillLevel,
          userGoals: userGoals || 'Learn ' + selectedTemplate
        })
      });

      navigate(`/roadmaps/${data.roadmap.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/roadmaps')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Roadmaps
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Learning Roadmap</h1>
        <p className="text-gray-600">Build a personalized career path with AI-powered customization</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Select Template */}
      {step === 'template' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Career Path</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.key}
                  onClick={() => setSelectedTemplate(template.key)}
                  className={`p-5 border-2 rounded-lg text-left transition-all ${
                    selectedTemplate === template.key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Target className="w-4 h-4" />
                    <span>{template.milestoneCount} milestones</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Skill Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {skillLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSkillLevel(level.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    skillLevel === level.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{level.label}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => step === 'template' && setStep('customize')}
            disabled={!selectedTemplate}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      )}

      {/* Step 2: Customize */}
      {step === 'customize' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <Sparkles className="w-5 h-5 inline mr-2 text-blue-600" />
              Customize Your Roadmap
            </h2>
            <p className="text-gray-600 mb-4">
              Tell us about your goals and we'll personalize the roadmap for you
            </p>
            <textarea
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              placeholder="e.g., I want to become a frontend developer specializing in React. I'm particularly interested in building mobile-first applications and want to learn TypeScript and modern UI frameworks."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={5}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('template')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Roadmap
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI will personalize the roadmap based on your skill level</li>
                  <li>• You'll get customized milestones with specific topics</li>
                  <li>• AI will suggest free learning resources (GFG, YouTube, etc.)</li>
                  <li>• You can track progress and mark milestones as complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
