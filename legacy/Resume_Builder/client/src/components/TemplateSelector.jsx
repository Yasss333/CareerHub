import { Check, FileVideo, Layout, LayoutIcon } from 'lucide-react';
import React, { useState } from 'react'

const TemplateSelector = ({selectedTemplate, onChange}) => {
    const[isOpen, setisOpen]=useState(false);

    const templates=[
        {
            id:"classic",
            name:"classic",
            preview:"A Classic Template with clear sections and Typographies"
        },
        {
            id:"modern",
            name:"modern",
            preview:"A Modern Template with Futuristic and Typographies"
        },
        {
            id:"minimal-image",
            name:"minimal-image",
            preview:"Minimal design with simple image"
        },
        {
            id:"minimal",
            name:"minimal",
            preview:"Ultra-clean design that puts your content front and center  "
        }
    ]

    return (
    <div className='relative'>
        <button onClick={()=>setisOpen(!isOpen)} className='flex rounded-lg text-sm px-3 py-2 items-center
        bg-gradient-to-br from-blue-50 to-blue-100 ring-blue-600 hover:ring transition-all'>
        <LayoutIcon size={18}/>
        <span className='max-sm:hidden'>Template</span>
        </button>
        {isOpen && (
        <div className='absolute top-full h-auto scroll-auto w-64 p-3 mt-2 space-y-3 
        z-20 bg-white rounded-md border border-gray-200
        shadow-sm  '>
            {templates.map((temp)=>{ 
                 return <div key={temp.id} onClick={()=>{onChange(temp.id); setisOpen(false)}}
                className={`relative cursor-pointer p-3 rounded-md border transition-all 
                ${selectedTemplate===temp.id ? "border-blue-500 bg-blue-500"
                    : "border-blue-300 hover:border-blue-600 hover:bg-gray-100"
                }`}>
                  
                {selectedTemplate===temp.id && (
                    <div className='absolute top-2 right-2'>
                        <div className='size-5 flex items-center justify-center rounded-full 
                        bg-blue-400'>
                            <Check className='w-3 h-3 text-white'/>
                        </div>
                    </div>
                )}

                <div >
                    <h4 className='font-medium text-black'>{temp.name}</h4>
                    
                    <div className='mt-3 italic p-2 bg-blue-100 rounded text-xs text-gray-500'>
                        {temp.preview}
                    </div>
                </div>
                </div>
            })}
        </div>
        )
            
        }
    </div>
  )
}

export default TemplateSelector