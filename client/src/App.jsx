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
import { useThemeStore } from './store/useThemeStore'
import { useChatStore } from './store/useChatStore'

const App = () => {

  const initializeAudio = useChatStore((state) => state.initializeAudio);
  
  useEffect(() => {
    // Initialize audio when app loads
    initializeAudio();
    
    // Optional: Enable audio context on first user interaction
    const enableAudio = () => {
      initializeAudio();
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, [initializeAudio]);
  
  const {authUser,checkAuth,isCheckingAuth} = useAuthStore();
  const {theme} = useThemeStore();

  useEffect( ()=>{
    checkAuth();
  },[checkAuth])

  // console.log(theme);

  if(isCheckingAuth && !authUser){
    return (
        <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    )
  }

  return (
    <div data-theme={theme}>
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