import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DashBoard from './DashBoard'
import {useSelector} from "react-redux";
import Loader from '../components/Loader';
import { LogOutIcon } from 'lucide-react';
import Login from './Login';

const Layout = () => {

  const{user, loading}=useSelector(state=>state.auth)

  if(loading){
    <Loader/>
  }

  return (
    <div>
      {
        user ?(<div className='min-h-screen bg-gray-50'>
          <Navbar/>
          
          <Outlet/>
        </div>):
        <Login/>
      }
        
    </div>
  )
}

export default Layout