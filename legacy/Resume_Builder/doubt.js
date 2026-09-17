  const query=new URLSearchParams(window.location.search);
  const urlState= query.get('query');


                         <p>Updated on {new Date(resume.updatedAt).toLocaleDateString}</p>
onClick={e=>e.stopPropagation()}


@layer base{
  botton{
    @apply cursor-pointer;
  } 
  input:not([type="checkbox"]){
    @apply outline-none focus:ring border border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-lg 
  }
   
}
            style={width:`%{activeSectionIndex * 100}/{sections.length-1}`} />

             <PersonalInfoForm data={resumeData.personal_info} onChange={(data)=>{
                  setresumeData(prev=>({...prev, personal_info:data
                  }))
                }}/>


                  <TemplateSelector  selectedTemplate={resumeData.template} 
                onChange={(template)=> setresumeData(prev=>({ ...prev, template})) }/>


                 const removeSkill=(indexToRemove)=>{
                onChange(data.filter((_,index)=>index !==indexToRemove))
       }








         const editTitle = async (e) => {
           try {
             e.preventDefault();
             const {data}=await api.put(`/api/resme/update`,{resumeId:editresumeId,resumeData:{title}},
               {headers:{Authorization:`Bearer ${token}`}}
             )
             setallResumes(resumes.map(resume=>resume._id===editresumeId ?{ ...resume,
               title} : resume))
               settitle('')
               setEditResumeId('')
               toast.success(data.message);
               
           } catch (error) {
             
           }
         };


         
A