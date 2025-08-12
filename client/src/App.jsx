import React, { useEffect } from 'react'
import { Routes,Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
import { useAuthStore } from './store/useAuthStore'
import {Loader} from "lucide-react"

const App = () => {

  
  const {authUser,checkAuth,isCheckingAuth} = useAuthStore();

  useEffect( ()=>{
    checkAuth();
  },[checkAuth])

  console.log(authUser);

  if(isCheckingAuth && !authUser){
    return (
        <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    )
  }

  return (
    <div className=''>
      <Navbar></Navbar>
      <Routes>
          <Route path='/' element={ authUser? <HomePage></HomePage> : <Navigate to='/login'></Navigate>} ></Route>
          <Route path='/signup' element={ !authUser? <SignUpPage></SignUpPage> : <Navigate to='/'></Navigate>} ></Route>
          <Route path='/login' element={!authUser? <LoginPage></LoginPage> : <Navigate to='/'></Navigate>} ></Route>
          <Route path='/settings' element={ <SettingsPage></SettingsPage>} ></Route>
          <Route path='/profile' element={ authUser? <ProfilePage></ProfilePage> : <Navigate to='/login'></Navigate>} ></Route>
      </Routes>

    </div>
  )
}

export default App