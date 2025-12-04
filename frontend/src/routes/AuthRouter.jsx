import { Navigate, Route, Routes } from 'react-router-dom'
import Signin from '../components/auth/Signin'
import { Verify } from '../components/auth/Verify'

const AuthRouter = () => {
  return (
    <Routes>
        <Route path='/' element={<Navigate to="/account/signin" replace/>}/>
        <Route path='/signin' element={<Signin />}/>
        <Route path='/verify' element={<Verify />}/>
    </Routes>
  )
}

export default AuthRouter