import { GraduationCap, Plus, Trash2 } from "lucide-react";

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  graduationDate?: string;
  gpa?: number;
}

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const EducationForm = ({ data, onChange }: EducationFormProps) => {
  const addEducation = () => {
    const newEducation: Education = {
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: undefined,
    };
    onChange([...data, newEducation]);
  };

  const removeEducation = (index: number) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education
          </h1>
          <p className="text-sm text-gray-500">Add your education details</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={addEducation}
            className="flex items-center gap-2 px-3 py-1 text-sm border-transparent hover:bg-green-400 hover:border-green-400 bg-green-300 rounded-lg border-slate-400"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <GraduationCap className="w-12 h-12 mx-auto text-gray-300" />
          <p>No education details added yet</p>
          <p className="text-xs">Please click "Add Education" to add education details</p>
        </div>
      ) : (
        <div>
          {data.map((education, index) => (
            <div key={index} className="bg-gray-100 rounded-lg px-3 py-2 space-y-3">
              <div className="flex justify-between">
                <h3>Education #{index + 1}</h3>
                <Trash2
                  onClick={() => removeEducation(index)}
                  className="w-4 h-4 text-red-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={education.institution || ""}
                    placeholder="Institution"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="text"
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={education.degree || ""}
                    placeholder="Degree (ex: BE, BTECH, MSC)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Field of Study</label>
                  <input
                    type="text"
                    onChange={(e) => updateEducation(index, "field", e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={education.field || ""}
                    placeholder="Field of Study (ex: Computer Science)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Graduation Date</label>
                  <input
                    type="month"
                    onChange={(e) => updateEducation(index, "graduationDate", e.target.value)}
                    className="w-full px-2 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={education.graduationDate || ""}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">GPA (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    onChange={(e) => updateEducation(index, "gpa", parseFloat(e.target.value))}
                    className="w-full px-2 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={education.gpa || ""}
                    placeholder="GPA (e.g., 3.5)"
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

export default EducationForm;