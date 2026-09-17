import React from "react";
import { Briefcase, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useState } from "react";
import toast from "react-hot-toast";
import api from '../../configs/api';

const ExperienceForm = ({ data, onChange }) => {

  const {token}=useSelector(state=>state.auth);
  const [generatingIndex, setgenerateIndex]=useState(-1);

  

  const addExperience = () => {
    const newExperience = {
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      description: "",
      is_current: false,
    };
    onChange([...data, newExperience]);
  };

  const removeExperince = (index) => {
    const updated = data.filter((_, i) => {
      i !== index;
    });
    onChange(updated);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };



const generateDescription = async (index) => {
  setgenerateIndex(index);
  const experience = data[index];
  const prompt = `enhance this job description "${experience.description}" for the position of "${experience.position}" at "${experience.company}"`;

  try {
    const response = await api.post(
      '/api/ai/enhance-pro-desc',
      { userContent: prompt },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // backend now returns enhancedSolution
    updateExperience(index, "description", response.data.enhancedSolution);
  } catch (error) {
    toast.error(error?.response?.data?.message || error.message);
  } finally {
    setgenerateIndex(-1);
  }
};


  return (
    <div className="space-y-6">
      <div className="flex justify-between  items-center ">
        <div className="">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            Enter Experience
          </h3>
        </div>
        <button
          onClick={addExperience}
          className="inline-flex items-center px-3  py-1 gap-2  bg-green-200 text-green-600 rounded-lg
            text-sm hover:bg-green-300 border border-transparent    hover:border-green-600 transition-colors disabled:opcaity-50 disabled:cursor-not-allowed"
        >
          Add Experience
          <Plus className="size-4 " />
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center text-gray-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No Work Experience added yet.</p>
          <p className="text-xs">
            
            CLick "Add Expreince" to fill out the experince section{" "}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((experince, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 
                    rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <h4>Experience #{index + 1}</h4>
                <button
                  onClick={() => {
                    removeExperince(index);
                  }}
                  className="text-red-400 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  onChange={(e) => {
                    updateExperience(index, "company", e.target.value);
                  }}
                  className="px-2 py-3 rounded-lg text-sm"
                  value={experince.company || ""}
                  placeholder="Enter COmpany name"
                />
                <input
                  type="text"
                  onChange={(e) => {
                    updateExperience(index, "position", e.target.value);
                  }}
                  className="px-2 py-3 rounded-lg text-sm"
                  value={experince.position || ""}
                  placeholder="Enter Job title "
                />
                <input
                  type="month"
                  onChange={(e) => {
                    updateExperience(index, "start_date", e.target.value);
                  }}
                  className="px-2 py-3 rounded-lg text-sm"
                  value={experince.start_date || ""}
                />
                <input
                  type="month"
                  onChange={(e) => {
                    updateExperience(index, "end_date", e.target.value);
                  }}
                  disabled={experince.is_current}
                  className="px-2 py-3 rounded-lg text-sm disabled:bg-gray-500"
                  value={experince.end_date || ""} 
                />
              </div>
              <label className="flex gap-2 items-center">
                <input type="checkbox" checked={experince.is_current ||false}
                 onChange={(e)=>{updateExperience(index,"is_current",e.target.checked ?true:false)}}
                 className="rounded border-gray-300 text-blue-600
                  focus:ring-blue-500"
                  />
                  <span className="text-sm test-gray-700">Currently working here </span>
              </label>
              <div className="space-y-2">
                <div className="flex justify-between mt-3  ">
                  <h3>Job Description </h3>
                  <button   onClick={()=>generateDescription(index)} 
                   disabled={generatingIndex===index  || !experince.position || !experince.company }
                  className=" flex bg-gradient-to-br from-purple-50
                   to-purple-400 text-purple-700 hover:bg-purple-200 transition-colors 
                  disabled:opacity-50 text-sm  rounded-lg px-3 py-1  border-transparent border-1 hover:border-purple-950 ">
                    {generatingIndex===index?(
                      <Loader2 className="w-3 h-3 animate-spin"/>
                    ):(

                    <Sparkles className="w-4 h-4 ml-2 mt-1 pt-0.5 "/>
                    )}
                    AI Enhance  
                  </button>
                </div>
                  <textarea value={experince.description||""}
                   rows={4} className="w-full text-sm px-3 py-2 rounded-lg  border resize-none "
                   onChange={(e)=>{updateExperience(index,"description",e.target.value)}}
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
