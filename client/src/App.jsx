import React from 'react'
import { Routes,Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import Navbar from './components/Navbar'
// import { useAuthStore } from './store/useAuthStore'

const App = () => {

  // const {authStore} = useAuthStore;

  return (
    <div>
      <Navbar></Navbar>
      <Routes>
          <Route path='/' element={<HomePage></HomePage>} ></Route>
          <Route path='/signup' element={<SignUpPage></SignUpPage>} ></Route>
          <Route path='/login' element={<LoginPage></LoginPage>} ></Route>
          <Route path='/settings' element={<SettingsPage></SettingsPage>} ></Route>
          <Route path='/profile' element={<ProfilePage></ProfilePage>} ></Route>
      </Routes>

    </div>
  )
}

export default App