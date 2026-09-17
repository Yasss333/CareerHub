import React, { useEffect } from 'react'
import { Route,Routes } from 'react-router-dom'
import Home from './pages/Home'
import DashBoard from './pages/DashBoard'
import Layout from './pages/Layout'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import { useDispatch } from 'react-redux'
import api from '../configs/api'
import {login, setloading} from "./app/features/authSlice.js"

import {Toaster} from "react-hot-toast"
const App = () => {

  const dispatch=useDispatch()
   const getUserData=async()=>{
    const token=localStorage.getItem('token');
    if (!token) {
    dispatch(setloading(false));
    return;
  }
    try {
        if(token){
          const {data}=await api.get('/api/user/data',{headers:{
            Authorization: `Bearer ${token}`,
          }})
          if(data.user){
            dispatch(login({token, user:data.user}))
          }
          dispatch(setloading(false))
        }else{
          dispatch(setloading(false));
        }
      } catch (error) {
      dispatch(setloading(false));
      console.log(error.message);
        
    }
   }

   useEffect(()=>{
    getUserData();
   },[])
  return (
    <>
    <Toaster/>
    <Routes>
    <Route path='/' element={<Home/>} />

    <Route path='app' element={<Layout/>}>
     <Route index element={<DashBoard/>} />
     <Route path='builder/:resumeId' element={<ResumeBuilder/>} />
    </Route>
    
   <Route path='view/:resumeId' element={<Preview/>} />
   {/* <Route path='login' element={<Login/>} /> */}

    </Routes>
    </>
  )
}

export default App