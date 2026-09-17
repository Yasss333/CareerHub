import React from "react";
import { GraduationCap, Plus, Trash, Trash2 } from "lucide-react";

const Education = ({ data, onChange }) => {
  const addEducation = () => { 
    const newEducation = {
      institution: "",
      degree: "",
      field: "",
      graduation_date: "",
      gpa: "",
    };
    onChange([...data, newEducation]);
  };

  const removeEducation = (index) => {
    const updated = data.filter((_, i) => 
      i !== index
    );
    onChange(updated);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Education</h1>
          <p className="text-sm text-gray-500"> Add your education details</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={addEducation} className=" flex items-center gap-2 px-3 py-1 text-sm border-transparent hover:bg-green-400 hover:border-green-400 bg-green-300 rounded-lg border-slate-400">
            <Plus className="size-4" />
            Add Education
          </button>

        </div>
      </div>
      {data.length===0 ?(
           <div className="text-center text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-300"/>
            <p>No eduaction details added yet</p>
            <p className="text-xs">Please click "Add Education "eduaction details</p>
           </div>
      ) :(
        <div>
            {data.map((education,index)=>(
                <div key={index} className="bg-gray-100 rounded-lg px-3 py-2 space-y-3">
                     <div className="flex justify-between  border-red-400 ">
                        <h3>Education #{index+1} </h3>
                        <Trash2 onClick={()=>removeEducation(index)} className="size-4 text-red-500"/>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <input type="text"
                        onChange={(e)=>updateEducation(index,"institution",e.target.value)}
                        className="px-2 py-2 rounded-lg text-sm " 
                        value={education.institution || ""} placeholder="Instutute" />
                        
                        <input type="text"
                        onChange={(e)=>updateEducation(index,"degree",e.target.value)}
                        className="px-2 py-2 rounded-lg text-sm " 
                        value={education.degree || ""} placeholder="Degree (ex:BE, BTECH,MSC ..etc)" />
                    
                        
                        <input type="text"
                        onChange={(e)=>updateEducation(index,"field",e.target.value)}
                        className="px-2 py-2 rounded-lg text-sm " 
                        value={education.field || ""} placeholder="Field of Study (ex:Your Branch )" />
                    
                        
                        <input type="month"
                        onChange={(e)=>updateEducation(index,"graduation_date",e.target.value)}
                        className="px-2 py-2 rounded-lg text-sm " 
                        value={education.graduation_date || ""}  />
                         
                         <input type="number"
                        onChange={(e)=>updateEducation(index,"gpa",e.target.value)}
                        className="px-2 py-2 rounded-lg text-sm " 
                        value={education.gpa || ""} placeholder="GPA (optional) " />
                    

                     </div>
                </div>
            ))}
        </div>
      )

      }
    </div>
  );
};

export default Education;
