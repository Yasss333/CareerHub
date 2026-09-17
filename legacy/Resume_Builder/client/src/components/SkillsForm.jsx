import { Plus, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react'

const SkillsForm = ({data, onChange}) => {
       const[newSkill, setNewSkill]=useState("");
        
       const addSkill=()=>{
        if(newSkill.trim() && !data.includes(newSkill.trim())){
            onChange([...data,newSkill])
            setNewSkill("")
        }
       }
       const removeSkill=(indexToRemove)=>{
                onChange(data.filter((_,index)=>index !==indexToRemove))
       }
       const handleEnterKey=(e)=>{
           if(e.key=="Enter"){
            e.preventDefault();
            addSkill();
           } 
       }
  return (
    <div className='space-y-4'>
          <div>
            <h3 className='flex items-center gap-2 font-semibold text-gray-900'>Skills</h3>
            <p className='text-sm test-gray-500'>Enter Your technical and soft skills</p>
          </div>

          <div className='flex gap-2'>
            <input type="text" placeholder="Enter skills like ex:javascript ,html, css etc"
            onChange={(e)=>{setNewSkill(e.target.value)}}
            value={newSkill}
            onKeyDown={handleEnterKey}
            className='flex-1 px-4 py-2 text-sm '
            />
             <button 
             onClick={addSkill} 
             disabled={!newSkill.trim()}
             className='flex px-4 py-2 bg-blue-500 hover:bg-blue-600
                text-white rounded-lg gap-2'>
                <Plus className='size-5' />
                 <span className='text-md hover:italic '>Add</span>
             </button>
          </div>

          {data.length>0 ? (
            <div className='flex flex-wrap gap-2'>

                {data.map((skill, index)=>(
                    <span key={index} className='flex item-center gap-1 
                    px-3 py-1 bg-blue-100 text-blue-800 rounded-full 
                    text-sm ' >
                            {skill}
                            <button onClick={()=>removeSkill(index)} className='ml-1 hover:bg-blue-200 rounded-lg transition-colors p-0.5'>
                                <X className='w-3 h-3'/>
                                </button>  
                    </span>                        

                ))} 
            </div> 
          ):(
            <div className=' text-center py-6 text-gray-300 hover:text-gray-400'>
                <Sparkles className='w-10 h-10 mx-auto mb-2'/>
                <p>No Skill added </p>
                <p className='text-sm' >Please click "+ADD" to add skills </p>
            </div>
          )}
          <div className='bg-blue-50 text-blue-700 border-blue-500 rounded-lg px-2 py-3'>
            <p className='text-md '><strong>Tip : </strong>Add 8-12 relevant skills. Include both technical skills (programming languages, tools) and soft skills (leadership, communication).</p>
          </div>
    </div>
  )
}

export default SkillsForm