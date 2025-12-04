import { Route, Routes } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import Account from '../pages/auth/Account';
import Productpage from '../pages/Productpage';
import Catalog from '../pages/Catalog';
import AdminAccount from '../pages/admin/auth/AdminAccount';
import PublicOnly from '../guards/PublicOnly';


const PageRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<Homepage />} />
      <Route path='/catalog' element={<Catalog />} />

      <Route element={<PublicOnly />}>
        <Route path='/account/*' element={<Account />} />
      </Route>

      <Route path='/products/:id' element={<Productpage />} />

      {/* ADMIN */}
      <Route path='/admin/account/*' element={<AdminAccount />} />
    </Routes>
  )
}

export default PageRouter