import { Check, Palette, PanelLeftCloseIcon } from 'lucide-react';
import React, { useState } from 'react'

const ColorPicker = ({selectedColor, onChange}) => {
   const colors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Gray", value: "#6B7280" },
  { name: "Black", value: "#1F2937" }
];

const [isOpen, setIsopen]=useState(false);

   return (
    <div className='relative'>
         <button onClick={()=>setIsopen(!isOpen)} className='flex justify-center
          gap-1 items-center
           text-purple-600 bg-gradient-to-br from-purple-50 to-purple-300
            text-sm ring-purple-800 hover:ring px-3 py-2 rounded-lg '>
            <Palette  size={18}/> <span className='max-sm:hidden'>Accent</span>
         </button>
         {isOpen && (
          <div className='grid
           grid-cols-4 w-60 absolute  top-0 left-0 right-0
            p-3 mt-2 z-10 bg-white shadow-lg rounded-md border border-gray-200 shadow-sm
             '>
              {colors.map((color)=>(
                <div key={color.value} className='relative cursor-pointer group flex 
                flex-col'  onClick={()=>{onChange(color.value); setIsopen(false)}}  >
                  <div className='w-12 h-12 rounded-full border border-transparent 
                  hover:border-gray-700 transition-colors' style={{backgroundColor:color.value}}>
                      {
                        selectedColor==color.value &&(
                          <div className='absolute inset-0 flex items-center justify-center'>
                            <Check className='  w-5 h-5  text-white'/>
                          </div>
                        )
                      }
                  </div>
                  <p className='text-sm text-center text-slate-600'>{color.name}</p>
                </div>
              ))}
             </div>
         )}
    </div>
  )
}

export default ColorPicker