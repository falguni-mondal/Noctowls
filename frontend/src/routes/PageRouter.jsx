import { Route, Routes } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import Account from '../pages/auth/Account';
import Productpage from '../pages/Productpage';
import Catalog from '../pages/Catalog';
import Collection from '../pages/Collection';
import PublicOnly from '../guards/PublicOnly';
import AdminPublicOnly from '../guards/admin/AdminPublicOnly';


import AdminOnly from '../guards/admin/AdminOnly';
import AdminSignin from '../pages/admin/auth/AdminSignin';
import AdminVerify from '../pages/admin/auth/AdminVerify';
import AdminDashboard from '../pages/admin/panel/AdminDashboard';
import AdminUsers from '../pages/admin/panel/AdminUsers';
import AdminProducts from '../pages/admin/panel/AdminProducts';
import AdminOrders from '../pages/admin/panel/AdminOrders';
import AdminWishlists from '../pages/admin/panel/AdminWishlists';
import AddProduct from '../pages/admin/services/product/AddProduct';
import UpdateProduct from '../pages/admin/services/product/UpdateProduct';
import AdminCoupons from '../pages/admin/services/product/coupon/AdminCoupons';
import AddCoupon from '../pages/admin/services/product/coupon/AddCoupon';
import Bagpage from '../pages/Bagpage';
import NoAdmin from '../guards/NoAdmin';
import UpdateCoupon from '../pages/admin/services/product/coupon/UpdateCoupon';
import Wishlistpage from '../pages/Wishlistpage';
import CheckoutPage from '../pages/Checkoutpage';
import AdminOrderDetails from '../pages/admin/services/orders/AdminOrderDetails';
import AdminReviews from '../pages/admin/panel/AdminReviews';
import Orderspage from '../pages/Orderspage';
import OrderDetailsPage from '../pages/OrderDetailsPage';
import AdminUserDetails from '../pages/admin/services/user/AdminUserDetails';
import AdminBags from '../pages/admin/panel/AdminBags';
import Contact from '../pages/Contact';
import AllReviews from '../pages/AllReviews';

// --- POLICY PAGE IMPORTS ---
import ShippingPolicy from '../pages/policies/ShippingPolicy';
import RefundPolicy from '../pages/policies/RefundPolicy';
import TermsOfService from '../pages/policies/TermsOfService';
import PrivacyPolicy from '../pages/policies/PrivacyPolicy';
import CookiePolicy from '../pages/policies/CookiePolicy';
import Disclaimer from '../pages/policies/Disclaimer';
import OrderReturnPage from '../pages/OrderReturnPage';
import Moon from '../pages/Moon';


const PageRouter = () => {
  return (
    <Routes>
      <Route path='/' element={<Homepage />} />
      <Route path='/catalog' element={<Catalog />} />
      <Route path='/contact' element={<Contact />} />
      <Route path='/products/:productId' element={<Productpage />} />
      <Route path="/products/:productId/reviews" element={<AllReviews />} />
      <Route path="/collection/:category/:group" element={<Collection />} />
      <Route path="/series/moon/:phase" element={<Moon />} />

      {/* --- POLICY ROUTES --- */}
      <Route path="/policies/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/policies/refund-policy" element={<RefundPolicy />} />
      <Route path="/policies/terms-of-service" element={<TermsOfService />} />
      <Route path="/policies/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/policies/cookie-policy" element={<CookiePolicy />} />
      <Route path="/policies/disclaimer" element={<Disclaimer />} />

      <Route element={<PublicOnly />}>
        <Route path='/account/*' element={<Account />} />
      </Route>

      <Route element={<NoAdmin />}>
        <Route path='/bag' element={<Bagpage />} />
        <Route path='/wishlist' element={<Wishlistpage />} />
        <Route path='/checkout' element={<CheckoutPage />} />
        <Route path="/orders" element={<Orderspage />} />
        <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/orders/:orderId/return" element={<OrderReturnPage />} />
      </Route>

      {/* ADMIN AUTH */}
      <Route element={<AdminPublicOnly />}>
        <Route path='/admin/signin' element={<AdminSignin />} />
        <Route path='/admin/verify' element={<AdminVerify />} />
      </Route>

      {/* ADMIN PANEL */}
      <Route element={<AdminOnly />}>
        {/* PANEL */}
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/users' element={<AdminUsers />} />
        <Route path='/admin/orders' element={<AdminOrders />} />
        <Route path='/admin/products' element={<AdminProducts />} />
        <Route path='/admin/coupons' element={<AdminCoupons />} />
        <Route path='/admin/reviews' element={<AdminReviews />} />
        <Route path='/admin/bags' element={<AdminBags />} />
        <Route path='/admin/wishlists' element={<AdminWishlists />} />

        {/* PRODUCT SERVICES */}
        <Route path='/admin/products/add' element={<AddProduct />} />
        <Route path='/admin/products/update/:productId' element={<UpdateProduct />} />

        <Route path='/admin/coupons/add' element={<AddCoupon />} />
        <Route path='/admin/coupons/update/:id' element={<UpdateCoupon />} />



        {/* ORDER SERVICES */}
        <Route path='/admin/orders/:id' element={<AdminOrderDetails />} />

        {/* USER SERVICE */}
        <Route path='/admin/users/:userId' element={<AdminUserDetails />} />

      </Route>
    </Routes>
  )
}

export default PageRouter