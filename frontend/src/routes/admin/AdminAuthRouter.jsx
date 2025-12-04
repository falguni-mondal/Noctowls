import { Route, Routes } from 'react-router-dom'
import AdminSignin from '../../components/admin/auth/AdminSignin'

const AdminAuthRouter = () => {
  return (
    <Routes>
      <Route path='/signin' element={<AdminSignin />} />
      <Route path='/signin' element={<AdminSignin />} />
    </Routes>
  )
}

export default AdminAuthRouter