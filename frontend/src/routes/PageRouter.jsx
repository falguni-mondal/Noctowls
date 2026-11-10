import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Homepage from "../pages/Homepage";
import PublicOnly from "../guards/PublicOnly";
import AdminPublicOnly from "../guards/admin/AdminPublicOnly";
import AdminOnly from "../guards/admin/AdminOnly";
import NoAdmin from "../guards/NoAdmin";
import Loader from "../utils/loader/Loader";

// Lazy-loaded Route Pages (including Productpage, Catalog, Collection, Moon, Auth, Checkout, Admin)
const Productpage = lazy(() => import("../pages/Productpage"));
const Account = lazy(() => import("../pages/auth/Account"));
const Catalog = lazy(() => import("../pages/Catalog"));
const Collection = lazy(() => import("../pages/Collection"));
const Moon = lazy(() => import("../pages/Moon"));
const Bagpage = lazy(() => import("../pages/Bagpage"));
const Wishlistpage = lazy(() => import("../pages/Wishlistpage"));
const CheckoutPage = lazy(() => import("../pages/Checkoutpage"));
const Orderspage = lazy(() => import("../pages/Orderspage"));
const OrderDetailsPage = lazy(() => import("../pages/OrderDetailsPage"));
const OrderReturnPage = lazy(() => import("../pages/OrderReturnPage"));
const Contact = lazy(() => import("../pages/Contact"));
const AllReviews = lazy(() => import("../pages/AllReviews"));

// Policy Pages
const ShippingPolicy = lazy(() => import("../pages/policies/ShippingPolicy"));
const RefundPolicy = lazy(() => import("../pages/policies/RefundPolicy"));
const TermsOfService = lazy(() => import("../pages/policies/TermsOfService"));
const PrivacyPolicy = lazy(() => import("../pages/policies/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("../pages/policies/CookiePolicy"));
const Disclaimer = lazy(() => import("../pages/policies/Disclaimer"));

// Admin Pages
const AdminSignin = lazy(() => import("../pages/admin/auth/AdminSignin"));
const AdminVerify = lazy(() => import("../pages/admin/auth/AdminVerify"));
const AdminDashboard = lazy(() => import("../pages/admin/panel/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/admin/panel/AdminUsers"));
const AdminProducts = lazy(() => import("../pages/admin/panel/AdminProducts"));
const AdminOrders = lazy(() => import("../pages/admin/panel/AdminOrders"));
const AdminWishlists = lazy(() => import("../pages/admin/panel/AdminWishlists"));
const AdminReviews = lazy(() => import("../pages/admin/panel/AdminReviews"));
const AdminBags = lazy(() => import("../pages/admin/panel/AdminBags"));
const AddProduct = lazy(() =>
  import("../pages/admin/services/product/AddProduct")
);
const UpdateProduct = lazy(() =>
  import("../pages/admin/services/product/UpdateProduct")
);
const AdminCoupons = lazy(() =>
  import("../pages/admin/services/product/coupon/AdminCoupons")
);
const AddCoupon = lazy(() =>
  import("../pages/admin/services/product/coupon/AddCoupon")
);
const UpdateCoupon = lazy(() =>
  import("../pages/admin/services/product/coupon/UpdateCoupon")
);
const AdminOrderDetails = lazy(() =>
  import("../pages/admin/services/orders/AdminOrderDetails")
);
const AdminUserDetails = lazy(() =>
  import("../pages/admin/services/user/AdminUserDetails")
);

const PageRouter = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products/:productId" element={<Productpage />} />
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
          <Route path="/account/*" element={<Account />} />
        </Route>

        <Route element={<NoAdmin />}>
          <Route path="/bag" element={<Bagpage />} />
          <Route path="/wishlist" element={<Wishlistpage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<Orderspage />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/orders/:orderId/return" element={<OrderReturnPage />} />
        </Route>

        {/* ADMIN AUTH */}
        <Route element={<AdminPublicOnly />}>
          <Route path="/admin/signin" element={<AdminSignin />} />
          <Route path="/admin/verify" element={<AdminVerify />} />
        </Route>

        {/* ADMIN PANEL */}
        <Route element={<AdminOnly />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/bags" element={<AdminBags />} />
          <Route path="/admin/wishlists" element={<AdminWishlists />} />

          {/* PRODUCT SERVICES */}
          <Route path="/admin/products/add" element={<AddProduct />} />
          <Route
            path="/admin/products/update/:productId"
            element={<UpdateProduct />}
          />

          <Route path="/admin/coupons/add" element={<AddCoupon />} />
          <Route path="/admin/coupons/update/:id" element={<UpdateCoupon />} />

          {/* ORDER SERVICES */}
          <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />

          {/* USER SERVICE */}
          <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default PageRouter;