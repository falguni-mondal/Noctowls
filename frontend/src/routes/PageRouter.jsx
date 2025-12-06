import { Route, Routes } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import Account from '../pages/auth/Account';
import Productpage from '../pages/Productpage';
import Catalog from '../pages/Catalog';
import PublicOnly from '../guards/PublicOnly';
import AdminPublicOnly from '../guards/admin/AdminPublicOnly';
import AdminOnly from '../guards/admin/AdminOnly';
import AdminSignin from '../pages/admin/auth/AdminSignin';
import AdminVerify from '../pages/admin/auth/AdminVerify';
import AdminDashboard from '../pages/admin/services/AdminDashboard';
import AdminUsers from '../pages/admin/services/AdminUsers';
import AdminProducts from '../pages/admin/services/AdminProducts';
import AdminOrders from '../pages/admin/services/AdminOrders';
import AdminCarts from '../pages/admin/services/AdminCarts';
import AdminWishlists from '../pages/admin/services/AdminWishlists';


const PageRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<Homepage />} />
      <Route path='/catalog' element={<Catalog />} />

      <Route element={<PublicOnly />}>
        <Route path='/account/*' element={<Account />} />
      </Route>

      <Route path='/products/:id' element={<Productpage />} />

      {/* ADMIN AUTH */}
      <Route element={<AdminPublicOnly />}>
        <Route path='/admin/signin' element={<AdminSignin />} />
        <Route path='/admin/verify' element={<AdminVerify />} />
      </Route>

      {/* ADMIN PANEL */}
      <Route element={<AdminOnly />}>
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/users' element={<AdminUsers />} />
        <Route path='/admin/orders' element={<AdminOrders />} />
        <Route path='/admin/products' element={<AdminProducts />} />
        <Route path='/admin/carts' element={<AdminCarts />} />
        <Route path='/admin/wishlists' element={<AdminWishlists />} />
      </Route>
    </Routes>
  )
}

export default PageRouter