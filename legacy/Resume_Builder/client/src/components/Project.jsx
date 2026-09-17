import { Plus, Sparkles, Trash2 } from 'lucide-react';
import React from 'react'

const Project = ({data, onChange}) => {

     const addProject = () => {
    const newProject = {
      name:"",
      type:"",
      description:"",
    };
    onChange([...data , newProject]);
  };

  const removeProject = (index) => {
    const updated = data.filter((_, i) => {
      i !== index;
    });
    onChange(updated);
  };

  const updateProject = (index, field, value) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };
    
  return (
    <div >
      <div className="flex justify-between  items-center p-3 ">
        <div className="">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Enter Project
          </h3>
        </div>
        <button
          onClick={addProject}
          className="inline-flex items-center px-3  py-1 gap-2  bg-green-200 text-green-600 rounded-lg
            text-sm hover:bg-green-300 border border-transparent    hover:border-green-600 transition-colors disabled:opcaity-50 disabled:cursor-not-allowed"
        >
          Add Projects
          <Plus className="size-4 " />
        </button>
      </div>
      
        <div className="space-y-4">
          {data.map((project, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 
                    rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <h4>Project #{index + 1}</h4>
                <button
                  onClick={() => {
                    removeProject(index);
                  }}
                  className="text-red-400 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-1 gap-3">
                <input
                  type="text"
                  onChange={(e) => {
                    updateProject(index, "name", e.target.value);
                  }}
                  className="px-2 py-3 rounded-lg text-sm"
                  value={project.name || ""}
                  placeholder="Enter project name"
                />
                <input
                  type="text"
                  onChange={(e) => {
                    updateProject(index, "type", e.target.value);
                  }}
                  className="px-2 py-3 rounded-lg text-sm"
                  value={project.type || ""}
                  placeholder="Enter Type (MERN, DEVOPS, APPDEV ....etc) "
                />
                <textarea
                  type="text" rows={4}
                  onChange={(e) => {
                    updateProject(index, "description", e.target.value);
                  }}
                  className="w-full px-3 py-2  rounded-lg text-sm"  placeholder='Enter  a concise and clear description aslo add live demo links if possible'
                  value={project.description || ""}
                />
                
              </div>
             
              <div className="space-y-2">
                <div className="flex justify-between mt-3  ">
                  <button className=" flex bg-gradient-to-br from-purple-50
                   to-purple-400 text-purple-700 hover:bg-purple-200 transition-colors 
                  disabled:opacity-50 text-sm  rounded-lg px-3 py-1  border-transparent  hover:border-purple-950 ">
                    AI Enhance  <Sparkles className="w-4 h-4 ml-2 mt-1 pt-0.5 "/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      
    </div>
  )
}

export default Project