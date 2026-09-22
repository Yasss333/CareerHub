import { Plus, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Project {
  name?: string;
  type?: string;
  description?: string;
}

interface ProjectFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

const ProjectForm = ({ data, onChange }: ProjectFormProps) => {
  const [generatingIndex, setGeneratingIndex] = useState(-1);

  const addProject = () => {
    const newProject: Project = {
      name: "",
      type: "",
      description: "",
    };
    onChange([...data, newProject]);
  };

  const removeProject = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const generateDescription = async (index: number) => {
    setGeneratingIndex(index);
    const project = data[index];
    const prompt = `enhance this project description "${project.description}" for project "${project.name}" of type "${project.type}"`;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ai/enhance-job-desc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userContent: prompt })
      });

      if (response.ok) {
        const result = await response.json();
        updateProject(index, "description", result.enhancedSolution);
      } else {
        alert('Failed to generate AI description');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Error generating AI description');
    } finally {
      setGeneratingIndex(-1);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center p-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Projects
          </h3>
        </div>
        <button
          onClick={addProject}
          className="inline-flex items-center px-3 py-1 gap-2 bg-green-200 text-green-600 rounded-lg text-sm hover:bg-green-300 border border-transparent hover:border-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No projects added yet</p>
          <p className="text-xs">Click "Add Project" to add your projects</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((project, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <h4>Project #{index + 1}</h4>
                <button
                  onClick={() => removeProject(index)}
                  className="text-red-400 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={project.name || ""}
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                  <input
                    type="text"
                    onChange={(e) => updateProject(index, "type", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={project.type || ""}
                    placeholder="Enter Type (MERN, DevOps, AppDev, etc.)"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between mt-3">
                    <h3 className="text-sm font-medium text-gray-700">Project Description</h3>
                    <button
                      onClick={() => generateDescription(index)}
                      disabled={generatingIndex === index || !project.name}
                      className="flex bg-gradient-to-br from-purple-50 to-purple-400 text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50 text-sm rounded-lg px-3 py-1 border-transparent hover:border-purple-950"
                    >
                      {generatingIndex === index ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          AI Enhance
                          <Sparkles className="w-4 h-4 ml-2 mt-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a concise and clear description, also add live demo links if possible"
                    value={project.description || ""}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectForm;