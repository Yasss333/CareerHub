import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { dummyResumeData } from '../assets/assets';
import Loader  from '../components/Loader';
import ResumePreview from '../components/ResumePreview';
import { ArrowLeft } from 'lucide-react';
import api from '../../configs/api';

const Preview = () => {
  const {resumeId}=useParams();
  const [resumeData, setresumeData]=useState(null)
  const[isLoading, setisLoading] =useState(true)
  const loadResume=async () => {
    setresumeData(dummyResumeData.find((resume=>resume._id===resumeId || null)))
    setisLoading(false)
    try {
      const { data } = await api.get('/api/resume/getPublicResumeById/' + resumeId)
      setresumeData(data.resume)
    } catch (error) {
      console.log(error.message);
    }
    finally{

      setisLoading(false)
    }
  }
  useEffect(()=>{
    loadResume()
    console.log("resume ID : ",resumeId);
    console.log("resume Data : ",resumeData);
  },[])

  return   resumeData ? (
    <div className='bg-slate-100'>
      <div className='max-w-3xl mx-auto py-10'>
       <ResumePreview data={resumeData} template={resumeData.template}
       accentColor={resumeData.accentColor} classes='py-4 bg-white' />
      </div>
      </div>
  ) :(
    <div>
      {isLoading ? <Loader/> :(
        <div className='flex justify-center items-center h-screen border-2 '>
        <div className='flex flex-col '>
            <p className='text-slate-400 text-center text-6xl font-medium'>Resume Not found </p>
          <a href="/" className='mt-6 m-1 px-6 h-9 bg-green-400
           hover:bg-green-500
          text-white  rounded-full ring-offset-1 ring-1 ring-green-400 flex items-center transition-colors'>
          <ArrowLeft  className='mr-2 size-4 '/>
          Go to Home Page
          </a>
        </div>
        </div>
      )}

    </div>
  )
}

export default Preview