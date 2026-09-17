import { Loader2, Sparkle, Sparkles, TableRowsSplit } from 'lucide-react'
import React from 'react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import api from '../../configs/api'
const ProffesionalSummary = ({data, setResumeData, onChange}) => {
  
    const {token}=useSelector(state=>state.auth)
    const [isGenerating, setisGenerating]=useState(false)

    const generateSummary=async ()=>{
        try {
            setisGenerating(true)
            console.log("This raw data",data);
            
                const prompt=`enhance my porffesional summary "${data}"`;
                const response=await api.post('/api/ai/enhance-pro-sum',{
                    userContent:prompt},
                    {headers:{Authorization:`Bearer ${token}`}})
                setResumeData(prev=>({...prev, professional_summary: response.data.enhancedSolution}))
                console.log("Enhamede daat : ", response.data.enhancedSolution);
        } catch (error) {
              toast.error(error?.response?.data?.mesage || error.message)            
        }
        finally{
            setisGenerating(false)
        }
    }
  
    return (
    <div className=' py-4 space-y-4 '>
        <div className='flex justify-between  items-center '>
            <div className=''>
               <h3 className='flex items-center gap-2 text-lg font-semibold text-gray-900'>Proffesional Summary</h3>
            </div>
            <button disabled={isGenerating} onClick={generateSummary} className='inline-flex items-center px-3  py-1 gap-2  bg-purple-200 text-purple-600 rounded
            text-sm hover:bg-purple-300 border border-transparent    hover:border-purple-900 transition-colors disabled:opcaity-50 disabled:cursor-not-allowed'
               >
                {isGenerating ? (<Loader2 className='size-4 animate-spin' />):(

                    <Sparkles className='size-4 '/>
                  )}
                    {isGenerating ? "Ehancing...":"AI Ehance"}
                
            </button>
        </div>
            <div className='mt-6'>
                <textarea value={data ||""} onChange={(e)=>onChange(e.target.value)} rows={7} className='w-full
                 p-4 px-4 mt-2 border text-sm 
                border-gray-300 rounded-lg focus:ring focus:ring-blue-500    outline-none
                transition-colors resize-none' placeholder='Write a compleelling proffesional summary '/>
                <p className='tetx-xs text-center text-slate-800 max-w-4/5'><span className='text-gray-900 font-semibold'>Tip :</span>Please keep it concise </p>
            </div>

    </div>
  )
}

export default ProffesionalSummary