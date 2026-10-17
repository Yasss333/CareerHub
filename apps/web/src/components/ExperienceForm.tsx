import { Briefcase, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

interface Experience {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrent?: boolean;
}

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const ExperienceForm = ({ data, onChange }: ExperienceFormProps) => {
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const [aiError, setAiError] = useState('');

  const addExperience = () => {
    const newExperience: Experience = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrent: false,
    };
    onChange([...data, newExperience]);
  };

  const removeExperience = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const generateDescription = async (index: number) => {
    setGeneratingIndex(index);
    setAiError('');
    const experience = data[index];

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/enhance-job-desc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entryType: 'experience',
          title: experience.position || '',
          organization: experience.company || '',
          description: experience.description || '',
        })
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || result?.error || 'AI enhancement failed. Please try again.');
      if (typeof result?.enhancedSolution !== 'string' || !result.enhancedSolution.trim()) {
        throw new Error('AI returned an empty description. Please try again.');
      }
      updateExperience(index, "description", result.enhancedSolution.trim());
    } catch (error) {
      console.error('AI generation error:', error);
      setAiError(error instanceof Error ? error.message : 'AI enhancement failed. Please try again.');
    } finally {
      setGeneratingIndex(-1);
    }
  };

  return (
    <div className="space-y-6">
      {aiError && <p role="alert" className="text-sm text-red-600">{aiError}</p>}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Briefcase className="w-5 h-5" />
            Work Experience
          </h3>
        </div>
        <button
          onClick={addExperience}
          className="inline-flex items-center px-3 py-1 gap-2 bg-green-200 text-green-600 rounded-lg text-sm hover:bg-green-300 border border-transparent hover:border-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No Work Experience added yet.</p>
          <p className="text-xs">
            Click "Add Experience" to fill out the experience section
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((experience, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <h4>Experience #{index + 1}</h4>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-400 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={experience.company || ""}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={experience.position || ""}
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="month"
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={experience.startDate || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="month"
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    disabled={experience.isCurrent}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    value={experience.endDate || ""}
                  />
                </div>
              </div>

              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={experience.isCurrent || false}
                  onChange={(e) => updateExperience(index, "isCurrent", e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Currently working here</span>
              </label>

              <div className="space-y-2">
                <div className="flex justify-between mt-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Experience Description</h3>
                    <p className="text-xs text-gray-500">Keep it focused: up to 2 short bullets.</p>
                  </div>
                  <button
                    onClick={() => generateDescription(index)}
                    disabled={generatingIndex === index || !experience.position || !experience.company || !experience.description?.trim()}
                    className="flex bg-gradient-to-br from-primary/10 to-primary/20 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50 text-sm rounded-lg px-3 py-1 border-transparent border-1 hover:border-primary"
                  >
                    {generatingIndex === index ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 ml-2 mt-0.5" />
                        Shorten & improve
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={experience.description || ""}
                  rows={4}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceForm;
