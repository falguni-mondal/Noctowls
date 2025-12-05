import { Route, Routes } from 'react-router-dom'
import AdminSignin from '../../components/admin/auth/AdminSignin'
import AdminVerify from '../../components/admin/auth/AdminVerify'

const AdminAuthRouter = () => {
  return (
    <Routes>
      <Route path='/signin' element={<AdminSignin />} />
      <Route path='/verify' element={<AdminVerify />} />
    </Routes>
  )
}

export default AdminAuthRouter