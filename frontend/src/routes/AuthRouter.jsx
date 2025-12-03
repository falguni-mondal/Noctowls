import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Signin from '../components/auth/Signin'
import Signup from '../components/auth/Signup'

const AuthRouter = () => {
  return (
    <Routes>
        <Route path='/' element={<Navigate to="/account/signin" replace/>}/>
        <Route path='/signin' element={<Signin />}/>
        <Route path='/signup' element={<Signup />}/>
    </Routes>
  )
}

export default AuthRouter